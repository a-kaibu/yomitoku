---
title: ポインタが指定の境界に揃っているかを確かめてから、型を変換する
description: Zig 標準ライブラリの math.alignCast。Alignment の check で、アドレスが境界の倍数かを調べ、揃っていれば @alignCast で変換し、揃っていなければエラーを返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1116, 1119]
function: alignCast
difficulty: 2
format: 2
tags: [低レイヤ, 防御的プログラミング, 型システム]
---

## ひとことで

`alignCast` は、ポインタを、より厳しい境界の型へ変換する関数です。変換の前に、アドレスが本当に境界に揃っているかを確かめます。揃っていなければ、エラーを返します。

## コード

```zig:line-numbers=1116
pub fn alignCast(comptime alignment: Alignment, ptr: anytype) AlignCastError!AlignCastResult(alignment, @TypeOf(ptr)) {
    if (alignment.check(@intFromPtr(ptr))) return @alignCast(ptr);
    return error.UnalignedMemory;
}
```

## 前提知識

- **アライメント（境界）**: データのアドレスが、ある大きさの倍数であることです。たとえば 4 バイト境界なら、アドレスは 4 の倍数です。
- **アライメントの厳しさ**: 境界が大きいほど、要求が厳しくなります。揃っていないアドレスを読むと、CPU によっては正しく動きません。
- **`@intFromPtr`**: ポインタを、アドレスを表す整数に変える組み込み関数です。
- **`@alignCast`**: 境界が揃っていることを前提にして、ポインタの型を変える組み込み関数です。
- **`alignment.check`**: 整数のアドレスが、その境界に揃っているかを調べる関数です。

## 何をしているか

### 1. アドレスが境界に揃っているかを確かめる

```zig:line-numbers=1117
    if (alignment.check(@intFromPtr(ptr))) return @alignCast(ptr);
```

`alignment.check(@intFromPtr(ptr))` で、ポインタのアドレスを整数にして、境界に揃っているかを調べます。

### 2. 揃っていれば変換する

```zig:line-numbers=1117
    if (alignment.check(@intFromPtr(ptr))) return @alignCast(ptr);
```

揃っていれば、`@alignCast` で、境界が揃ったポインタとして型を変えます。この確認が済んでいるので、安全に変換できます。

### 3. 揃っていなければエラーを返す

```zig:line-numbers=1118
    return error.UnalignedMemory;
```

揃っていなければ、`error.UnalignedMemory` を返します。黙って変換せず、呼び出し側に知らせます。

## ここがすごい

- **確認と変換を分けている**: 変換の前に、実際のアドレスを調べます。変換の仕組みが、安全に使える形になっています。
- **エラーで扱いを強制**: 戻り値の型がエラーを含むので、呼び出し側は揃っていない場合を必ず扱います。
- **実行時の確認が明示的**: 境界の違反を、クラッシュではなくエラーとして返します。
- **結果の型が境界を表す**: 変換後の型に、新しい境界が反映されます。

## まとめ

- `alignCast` は、アドレスが境界に揃っているかを確かめてから、ポインタの型を変えます。
- 揃っていなければ、`error.UnalignedMemory` を返します。
- 確認を済ませた後だけ、安全な変換を行います。
