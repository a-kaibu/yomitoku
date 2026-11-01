---
title: 失敗するたびに待つ時間を 2 倍にする、ロック不要の待ち方
description: CAS が失敗したときに、待つ時間を 1, 2, 4 …と倍々に増やす crossbeam の Backoff::spin。上限を決めて、待ちすぎないようにしている。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-utils/src/backoff.rs
lines: [146, 154]
function: Backoff::spin
difficulty: 2
format: 2
tags: [並行処理, ロック不要, 最適化]
---

## ひとことで

`Backoff::spin` は、**ロックを使わない（ロック不要の）ループで、再試行の前に少し待つ** ための関数です。
待つ時間は、呼ばれるたびに 2 倍になります。最初は CPU の休止命令 1 回、次は 2 回、その次は 4 回と増えていきます。

他のスレッドとぶつかって操作に失敗したとき、すぐ同じ操作を繰り返すと、そのぶつかりがさらに続きやすくなります。この関数は、失敗が続くほど間隔を空けることで、競合を和らげます。

## コード

```rust:line-numbers=146
    pub fn spin(&self) {
        for _ in 0..1 << self.step.get().min(SPIN_LIMIT) {
            hint::spin_loop();
        }

        if self.step.get() <= SPIN_LIMIT {
            self.step.set(self.step.get() + 1);
        }
    }
```

この関数が使う上限の定数は、同じファイルの冒頭にあります。`SPIN_LIMIT` が 6 なので、待つ回数は最大 2 の 6 乗、つまり 64 回までになります。

```rust:line-numbers=5
const SPIN_LIMIT: u32 = 6;
const YIELD_LIMIT: u32 = 10;
```

## 前提知識

- **CAS（compare-and-swap）**: 「今の値が期待どおりなら書き換える」を 1 回の操作で行う命令です。ロックを使わずに値を更新するときの基本です。失敗すると、もう一度読み直して試します。
- **`Cell<u32>`**: 中身を `&self` 越しに書き換えられる型です。`self.step.get()` で値を読み、`self.step.set(...)` で書きます。Backoff が状態をもつために使われています。
- **`for _ in 0..n`**: `_` は使わない変数です。ここでは「n 回繰り返す」だけの目的で書かれています。
- **`1 << x`**: 1 を x ビット左にずらすと、2 の x 乗になります。`1 << 3` は 8 です。
- **`min`**: 2 つの値のうち小さいほうを返すメソッドです。`self.step.get().min(SPIN_LIMIT)` は、`step` と `SPIN_LIMIT` の小さいほうを返します。
- **`hint::spin_loop()`**: CPU に「いまは待っている」と伝える関数です。x86 では `pause` 命令になり、待ちの間の電力を下げたり、同じ CPU の別のスレッドを優先したりします。

## 何をしているか

### 1. 待つ回数を決める

```rust:line-numbers=147
        for _ in 0..1 << self.step.get().min(SPIN_LIMIT) {
            hint::spin_loop();
        }
```

`step` は、いま何回待ったかを表す数です。`min(SPIN_LIMIT)` で 6 を上限にして、`1 << step` 回だけ `spin_loop` を呼びます。
`step` が 0, 1, 2, 3, 4, 5, 6 のとき、待つ回数はそれぞれ 1, 2, 4, 8, 16, 32, 64 です。7 以上では 64 のまま変わりません。

### 2. 次の回に備えて段階を進める

```rust:line-numbers=151
        if self.step.get() <= SPIN_LIMIT {
            self.step.set(self.step.get() + 1);
        }
```

`step` が上限以下なら 1 増やします。上限を超えたら増やしません。`step` が無限に大きくならないので、`1 << step` がオーバーフローすることもありません。

### 3. 呼ぶ流れの例

失敗のたびに `spin` を呼ぶと、待つ回数は次のように増えます。

```
1 回目の失敗 → 1 回休止 → step は 1
2 回目の失敗 → 2 回休止 → step は 2
3 回目の失敗 → 4 回休止 → step は 3
…
7 回目以降の失敗 → 64 回休止（上限）
```

## ここがすごい

- **競合が続くほど間隔を広げる**: 同じタイミングで何人もが同じ場所を叩くと、いつまでも衝突が続きます。待つ時間を倍々にすると、衝突する確率が下がり、誰かが先に進めるようになります。この方法は「指数バックオフ」と呼ばれる定番の手法です。
- **上限で待ちすぎを防ぐ**: 倍々に増やし続けると、長く待ちすぎて遅くなります。`SPIN_LIMIT` で上限を決め、64 回で打ち切っています。
- **カウンタを `Cell` で持つ**: `spin` は `&self` を受け取るので、同じ `Backoff` を借用したまま状態を更新できます。`mut` を付けずに済むので、ループの中で使いやすくなっています。
- **分岐が少ない**: 待つ回数の計算は `min` と `<<` だけです。ループの回数も 1 回の計算で決まります。
- **OS に渡さない**: この関数は CPU の休止命令だけを使い、スレッドを眠らせません。短い間隔で再試行したいロック不要のループに向いています。長く待つ場合は、呼び出し側が `snooze` などの別の関数を使います。

## まとめ

- 失敗するたびに待つ時間を倍にすると、競合が自然に和らぐ。
- 上限を決めると、待ちすぎによる遅延を防げる。
- 状態を `Cell` で持つと、`&self` のまま更新できて使いやすい。
- ロック不要の処理では、CPU の休止命令だけを使う短い待ちが向いている。
