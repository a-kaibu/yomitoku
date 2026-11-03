---
title: 3 つの状態と 1 つのカウンタだけで回す、小さくて速い乱数
description: Sfc64 の 1 回分の出力。足し算、XOR、シフト、回転を組み合わせ、カウンタを足して周期を長く保つ。PractRand の検定で高く評価された。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random/Sfc64.zig
lines: [29, 36]
function: Sfc64.next
difficulty: 2
format: 2
tags: [乱数, ビット演算, 最適化]
---

## ひとことで

`next` は、Sfc64 という乱数生成器の 1 回分の出力を作る関数です。3 つの状態と 1 つのカウンタを更新し、その合計を返します。
ファイルの冒頭には、「PractRand という乱数検定で最速かつ最小の方式」と書かれています。

## コード

```zig:line-numbers=29
fn next(self: *Sfc64) u64 {
    const tmp = self.a +% self.b +% self.counter;
    self.counter += 1;
    self.a = self.b ^ (self.b >> RightShift);
    self.b = self.c +% (self.c << LeftShift);
    self.c = math.rotl(u64, self.c, Rotation) +% tmp;
    return tmp;
}
```
```zig:line-numbers=14
const Rotation = 24;
const RightShift = 11;
const LeftShift = 3;
```
## 前提知識

- **カウンタ（counter）**: 1 回ごとに 1 ずつ増えていく値です。状態の循環が同じ場所に戻ることを防ぎ、周期を長くします。
- **`+%` と `+=`**: `+%` は溢れを折り返して足す演算です。`+=` は普通の足し算ですが、`u64` の最大値を超えるとエラーになります（安全モード）。カウンタは 2^64 回も増えないので、この書き方で問題ありません。
- **`>>` と `<<`**: ビットの右シフトと左シフトです。`b >> 11` は右に 11 ビットずらします。
- **`math.rotl`**: ビットを左に回転させる関数です。はみ出したビットが右から戻ってきます。
- **`const Rotation = 24`**: 関数の外で決めた定数です。回転やシフトの幅を名前で表しています。

## 何をしているか

### 1. 出力する値を先に作る

```zig:line-numbers=30
    const tmp = self.a +% self.b +% self.counter;
    self.counter += 1;
```

まず、`a`、`b`、`counter` の 3 つを足した値を `tmp` にします。これが、この回の出力です。そのあと、カウンタを 1 増やします。

カウンタがあることで、状態の `a`、`b`、`c` が偶然同じ値に戻っても、生成される値は毎回違うものになります。

### 2. a と b を XOR とシフトで変える

```zig:line-numbers=32
    self.a = self.b ^ (self.b >> RightShift);
    self.b = self.c +% (self.c << LeftShift);
```

新しい `a` は、古い `b` と、その右シフトの XOR です。新しい `b` は、古い `c` と、その左シフトの和です。XOR と足し算、シフトを組み合わせて、状態のビットを攪拌しています。

### 3. c を回転させて、出力を混ぜ込む

```zig:line-numbers=34
    self.c = math.rotl(u64, self.c, Rotation) +% tmp;
    return tmp;
```

新しい `c` は、古い `c` を 24 ビット回転させ、先ほどの `tmp` を足したものです。出力の値が、次の状態にも残るので、循環がつながります。最後に `tmp` を返します。

### 4. 最初に 12 回回しておく

```zig:line-numbers=38
    fn seed(self: *Sfc64, init_s: u64) void {
```

`seed` 関数は、同じ種 `init_s` で 3 つの状態を埋めた後、`next` を 12 回空回しします。最初の数回の出力は種の影響が強く残るので、捨てておくことで出だしを安定させます。

## ここがすごい

- **少ない命令で周期が長い**: 状態は 3 つの `u64` とカウンタだけです。加算、XOR、シフト、回転という単純な命令で、長い周期を保っています。
- **統計検定に強い**: ソースに書かれた PractRand は、乱数の偏りを調べる検定です。その検定で、速さと品質のバランスが優れていると評価されています。
- **カウンタで弱点を補う**: 状態の循環だけでは、ある種の値の組み合わせで周期が短くなる恐れがあります。カウンタを足すことで、その弱点を補っています。
- **定数を名前で書く**: `RightShift`、`LeftShift`、`Rotation` を定数にして、読む人が意味を追えるようにしています。

## まとめ

- Sfc64 は、3 つの状態とカウンタを使う、軽くて速い乱数生成器です。
- 出力は、3 つの状態とカウンタを足した値です。
- XOR、シフト、回転を組み合わせて、状態を攪拌します。
- 種を入れたあと数回空回しすると、出だしの偏りを減らせます。
