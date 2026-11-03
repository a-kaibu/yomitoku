---
title: アドレスを境界の倍数へ切り上げる、2 のべき乗の境界専用の計算
description: Zig 標準ライブラリの mem.alignForward。アドレスに境界の大きさ − 1 を足してから、境界の倍数へ切り下げる。境界は 2 のべき乗でなければならず、確認は assert で行う。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4693, 4696]
function: alignForward
difficulty: 2
format: 2
tags: [低レイヤ, ビット演算, メモリ管理]
---

## ひとことで

`alignForward` は、アドレスを、指定した境界の倍数のうち、アドレス以上で最も小さいものへ切り上げる関数です。メモリの確保で、次に置くデータの開始位置を揃えるときなどに使われます。

## コード

```zig:line-numbers=4693
pub fn alignForward(comptime T: type, addr: T, alignment: T) T {
    assert(isValidAlignGeneric(T, alignment));
    return alignBackward(T, addr + (alignment - 1), alignment);
}
```

## 前提知識

- **アライメント（境界）**: アドレスが、ある大きさの倍数であることです。たとえば 16 バイト境界なら、アドレスは 16 の倍数です。
- **切り上げと切り下げ**: 切り上げは、アドレス以上の最も近い境界の値です。切り下げは、アドレス以下の最も近い値です。
- **2 のべき乗の境界**: 境界が 2 のべき乗なら、ビットのマスクで切り下げられます。
- **`alignBackward`**: 同じファイルにある関数で、アドレスを境界の倍数へ切り下げます。
- **`isValidAlignGeneric`**: 境界が有効な値（2 のべき乗で 0 より大きい）かを確かめる関数です。

## 何をしているか

### 1. 境界が有効かを確かめる

```zig:line-numbers=4694
    assert(isValidAlignGeneric(T, alignment));
```

境界が 2 のべき乗で、0 より大きいことを `assert` で確かめます。違えば、ここで止まります。

### 2. 境界の分を足してから切り下げる

```zig:line-numbers=4695
    return alignBackward(T, addr + (alignment - 1), alignment);
```

`addr + (alignment - 1)` で、アドレスを次の境界まで押し上げます。そのうえで `alignBackward` で境界の倍数へ切り下げると、切り上げの結果が得られます。すでに境界の倍数なら、その値のままです。

## ここがすごい

- **足して切り下げるだけ**: 切り上げを、足し算と切り下げの 2 段で表せます。剰余や分岐が要りません。
- **前提が明示**: 境界の条件を `assert` で確かめるので、誤った境界の使用を早く見つけられます。
- **ビットで高速**: 2 のべきの境界なら、切り下げはビットの AND で済みます。
- **溢れの注意**: 注釈にあるとおり、切り上げでアドレスが溢れないことが前提です。

## まとめ

- `alignForward` は、アドレスを 2 のべきの境界の倍数へ切り上げます。
- 境界の大きさ − 1 を足してから、切り下げる形で計算します。
- 境界の条件は `assert` で確かめます。
