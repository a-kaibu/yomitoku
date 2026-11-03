---
title: 3 つの状態を回し合わせて、速さを優先した乱数を作る
description: 3 つの 64 ビット状態を、掛け算、引き算、回転で入れ替えていく Romu Trio の乱数生成。速いが暗号には使えない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random/RomuTrio.zig
lines: [23, 33]
function: RomuTrio.next
difficulty: 2
format: 2
tags: [乱数, ビット演算, アルゴリズム]
---

## ひとことで

`next` は、乱数生成器 Romu Trio の 1 回分の出力を作る関数です。3 つの状態 `x_state`、`y_state`、`z_state` を、掛け算、引き算、回転で入れ替えてから、古い `x` の値を返します。
状態が 3 つあるので、同じ 64 ビットの値を 1 つ持つ生成器よりも、長い周期を保てます。

ファイルの冒頭には、「この乱数は予測されやすいので、暗号には決して使わない」と書かれています。

## コード

```zig:line-numbers=23
fn next(self: *RomuTrio) u64 {
    const xp = self.x_state;
    const yp = self.y_state;
    const zp = self.z_state;
    self.x_state = 15241094284759029579 *% zp;
    self.y_state = yp -% xp;
    self.y_state = std.math.rotl(u64, self.y_state, 12);
    self.z_state = zp -% yp;
    self.z_state = std.math.rotl(u64, self.z_state, 44);
    return xp;
}
```
## 前提知識

- **状態（state）**: 乱数生成器が、次の値を決めるために覚えている値です。ここでは 3 つの `u64` が状態です。
- **`self.x_state`**: 構造体の中の値です。`self` は、その構造体の参照（ポインタ）です。
- **`*%`、`-%`**: オーバーフローしたら折り返す掛け算と引き算です。
- **`std.math.rotl`**: ビットを左に回転させる関数です。左にはみ出したビットが右から入ってきます。たとえば 8 ビットの `0b1000_0001` を 1 回回転させると `0b0000_0011` です。
- **`const`**: 値を変えない変数です。ここでは、回す前の状態を 3 つ一時的に保存しています。
- **`std.Random`**: 乱数を使うための共通の窓口です。この生成器は `random` 関数で、その窓口に変換できます。

## 何をしているか

### 1. 回す前の状態を覚える

```zig:line-numbers=24
    const xp = self.x_state;
    const yp = self.y_state;
    const zp = self.z_state;
```

状態を変える前に、3 つの値を `xp`、`yp`、`zp` に保存します。新しい状態は、この古い値をもとに計算されるので、順番を間違えると結果が変わってしまいます。

### 2. x の状態は、z に掛け算をする

```zig:line-numbers=27
    self.x_state = 15241094284759029579 *% zp;
```

新しい `x` は、古い `z` に大きな奇数の定数を掛けたものです。掛け算によって、`z` のビットが上位へ広がります。

### 3. y の状態は、差を回転させる

```zig:line-numbers=28
    self.y_state = yp -% xp;
    self.y_state = std.math.rotl(u64, self.y_state, 12);
```

新しい `y` は、古い `y` から古い `x` を引いた値を、12 ビット回転させたものです。引き算で差を作り、回転でそのビットを上の位置へ移します。

### 4. z の状態も、同じ形で作る

```zig:line-numbers=30
    self.z_state = zp -% yp;
    self.z_state = std.math.rotl(u64, self.z_state, 44);
```

新しい `z` は、古い `z` から古い `y` を引いて、44 ビット回転させたものです。`x`、`y`、`z` が互いに影響し合うので、3 つの状態が循環します。

### 5. 古い x を出力する

```zig:line-numbers=32
    return xp;
```

返す値は、更新前の `x` です。新しい `x` を返さないことで、状態の更新と出力の値がずれています。

## ここがすごい

- **掛け算、引き算、回転だけ**: 特別な表やテーブルは使いません。命令数が少ないので、CPU の上で非常に速く動きます。
- **3 つの状態で長い周期**: 状態を 1 つだけにするより、循環の長さを確保しやすい設計です。ファイルには参考論文（arXiv の 2002.11331）へのリンクが書かれています。
- **種は SplitMix64 で作る**: 3 つの状態を、ユーザーが渡した 1 つの値から作るために、前の記事の SplitMix64 を使っています。状態の初期値がばらばらになり、少ない種でも良い出だしになります。
- **用途を限定する**: ソースに「暗号には使わない」と明記されています。速さのために、予測のしやすさを割り切っている点が設計の特徴です。

## まとめ

- Romu Trio は、3 つの 64 ビット状態を循環させる乱数生成器です。
- 掛け算、引き算、回転だけで更新するので、とても速く動きます。
- 更新の前に古い値を保存し、古い `x` を出力するのが、ここでの順番です。
- 予測できるので、暗号やパスワードには使えません。統計の処理やゲームなどに向いています。
