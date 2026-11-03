---
title: 境界が 2 のべきでなくても、アドレスを切り上げられるようにする
description: Zig 標準ライブラリの mem.alignForwardAnyAlign。境界が 2 のべきなら高速な alignForward を使い、そうでなければ別の計算で切り上げる。任意の大きさの境界に対応する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4683, 4688]
function: alignForwardAnyAlign
difficulty: 2
format: 2
tags: [低レイヤ, 最適化, 防御的プログラミング]
---

## ひとことで

`alignForwardAnyAlign` は、どんな大きさの境界でも、アドレスを切り上げられる関数です。境界が 2 のべきなら、速い `alignForward` に任せます。そうでなければ、別の経路で切り上げます。

## コード

```zig:line-numbers=4683
pub fn alignForwardAnyAlign(comptime T: type, addr: T, alignment: T) T {
    if (isValidAlignGeneric(T, alignment))
        return alignForward(T, addr, alignment);
    assert(alignment != 0);
    return alignBackwardAnyAlign(T, addr + (alignment - 1), alignment);
}
```

## 前提知識

- **2 のべきの境界**: 1、2、4、8、16 などの境界です。ビットの計算で速く扱えます。
- **任意の境界**: 12 や 24 のように、2 のべきでない大きさの境界です。ビットの計算が使えず、割り算などで求めます。
- **`isValidAlignGeneric`**: 境界が 2 のべきかを確かめる関数です。
- **`alignForward`**: 2 のべきの境界を前提にした、切り上げの関数です。
- **`alignBackwardAnyAlign`**: 任意の境界で切り下げる、同じファイルの関数です。

## 何をしているか

### 1. 2 のべきの境界なら速い版へ

```zig:line-numbers=4684
    if (isValidAlignGeneric(T, alignment))
        return alignForward(T, addr, alignment);
```

境界が有効な 2 のべきなら、`alignForward` を使います。ビットの計算だけで済む、一番速い経路です。

### 2. それ以外は任意の境界で計算する

```zig:line-numbers=4686
    assert(alignment != 0);
    return alignBackwardAnyAlign(T, addr + (alignment - 1), alignment);
```

境界が 0 でないことを確かめてから、`addr + (alignment - 1)` を、`alignBackwardAnyAlign` で任意の境界に切り下げます。切り上げを、切り下げの形に変換しています。

## ここがすごい

- **速い経路を先に選ぶ**: 多くの用途は 2 のべきの境界です。その場合は、ビットの計算だけで済みます。
- **一般の場合も同じ形**: 任意の境界でも、「足してから切り下げる」の考え方が使えます。
- **分岐を 1 か所に**: 2 のべきかどうかの判定は、最初の `if` だけです。呼び出し側は、境界の種類を気にしません。
- **0 の境界を拒否**: `assert(alignment != 0)` で、0 で割る誤りを防いでいます。

## まとめ

- `alignForwardAnyAlign` は、2 のべきなら速い版、そうでなければ任意の境界の計算を行います。
- どちらも「足してから切り下げる」の考え方で、アドレスを切り上げます。
- 境界は 0 であってはならず、`assert` で確かめます。
