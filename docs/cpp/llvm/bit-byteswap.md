---
title: コンパイラの組み込み関数がなくても動く、バイト順の入れ替え
description: 整数のバイトの並びを逆にする byteswap です。if constexpr で型の大きさごとに分岐し、組み込み関数、MSVC の関数、自前のシフト演算の順に使えるものを選びます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/bit.h
lines: [100, 146]
function: llvm::byteswap
difficulty: 2
format: 2
tags: [ビット演算, 移植性, 低レイヤ]
---

## ひとことで

`byteswap` は、整数を作るバイトの **並び順を逆にする** 関数です。たとえば 32 ビットの `0x11223344` は `0x44332211` になります。
ファイルやネットワークのデータを読むとき、書いたマシンと読むマシンでバイトの並び（エンディアン）が違う場合に使います。

## コード

::: code-group

```cpp:line-numbers=100 [日本語訳]
/// 与えられた整数値 V のバイト順を逆にする。
template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
[[nodiscard]] constexpr T byteswap(T V) noexcept {
  if constexpr (sizeof(T) == 1) {
    return V;
  } else if constexpr (sizeof(T) == 2) {
    uint16_t UV = V;
#if __has_builtin(__builtin_bswap16)
    return __builtin_bswap16(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    // DLL 版のランタイムにはこれらの関数がない（バグ!?）が、
    // リリースビルドではどのみち BSWAP 命令に置き換えられる。
    return _byteswap_ushort(UV);
#else
    uint16_t Hi = UV << 8;
    uint16_t Lo = UV >> 8;
    return Hi | Lo;
#endif
  } else if constexpr (sizeof(T) == 4) {
    uint32_t UV = V;
#if __has_builtin(__builtin_bswap32)
    return __builtin_bswap32(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_ulong(UV);
#else
    uint32_t Byte0 = UV & 0x000000FF;
    uint32_t Byte1 = UV & 0x0000FF00;
    uint32_t Byte2 = UV & 0x00FF0000;
    uint32_t Byte3 = UV & 0xFF000000;
    return (Byte0 << 24) | (Byte1 << 8) | (Byte2 >> 8) | (Byte3 >> 24);
#endif
  } else if constexpr (sizeof(T) == 8) {
    uint64_t UV = V;
#if __has_builtin(__builtin_bswap64)
    return __builtin_bswap64(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_uint64(UV);
#else
    uint64_t Hi = llvm::byteswap<uint32_t>(UV);
    uint32_t Lo = llvm::byteswap<uint32_t>(UV >> 32);
    return (Hi << 32) | Lo;
#endif
  } else {
    static_assert(!sizeof(T *), "Don't know how to handle the given type.");
    return 0;
  }
}
```

```cpp:line-numbers=100 [原文]
/// Reverses the bytes in the given integer value V.
template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
[[nodiscard]] constexpr T byteswap(T V) noexcept {
  if constexpr (sizeof(T) == 1) {
    return V;
  } else if constexpr (sizeof(T) == 2) {
    uint16_t UV = V;
#if __has_builtin(__builtin_bswap16)
    return __builtin_bswap16(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    // The DLL version of the runtime lacks these functions (bug!?), but in a
    // release build they're replaced with BSWAP instructions anyway.
    return _byteswap_ushort(UV);
#else
    uint16_t Hi = UV << 8;
    uint16_t Lo = UV >> 8;
    return Hi | Lo;
#endif
  } else if constexpr (sizeof(T) == 4) {
    uint32_t UV = V;
#if __has_builtin(__builtin_bswap32)
    return __builtin_bswap32(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_ulong(UV);
#else
    uint32_t Byte0 = UV & 0x000000FF;
    uint32_t Byte1 = UV & 0x0000FF00;
    uint32_t Byte2 = UV & 0x00FF0000;
    uint32_t Byte3 = UV & 0xFF000000;
    return (Byte0 << 24) | (Byte1 << 8) | (Byte2 >> 8) | (Byte3 >> 24);
#endif
  } else if constexpr (sizeof(T) == 8) {
    uint64_t UV = V;
#if __has_builtin(__builtin_bswap64)
    return __builtin_bswap64(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_uint64(UV);
#else
    uint64_t Hi = llvm::byteswap<uint32_t>(UV);
    uint32_t Lo = llvm::byteswap<uint32_t>(UV >> 32);
    return (Hi << 32) | Lo;
#endif
  } else {
    static_assert(!sizeof(T *), "Don't know how to handle the given type.");
    return 0;
  }
}
```

:::

## 前提知識

- **エンディアン**: 複数バイトの数をメモリに置く順番です。小さい桁から置く「リトルエンディアン」と、大きい桁から置く「ビッグエンディアン」があります。
- **`template <typename T, typename = std::enable_if_t<...>>`**: 条件を満たす型 `T` のときだけこの関数を使えるようにする書き方です。ここでは整数型だけを受け付けます。
- **`constexpr`**: コンパイル時にも計算できる関数です。
- **`if constexpr`**: コンパイル時に分岐を決め、選ばれなかった側は作られません。
- **`#if __has_builtin(...)`**: プリプロセッサ（コンパイル前の文字置換の段階）で、コンパイラに特定の組み込み関数があるかを調べます。
- **組み込み関数 `__builtin_bswap32`**: コンパイラが用意する特別な関数で、CPU の専用命令 1 個に置き換わることが多いです。
- **`[[nodiscard]]`**: 戻り値を捨てると警告が出ます。

## 何をしているか

### 1. 大きさで分岐

```cpp:line-numbers=103
  if constexpr (sizeof(T) == 1) {
    return V;
  } else if constexpr (sizeof(T) == 2) {
    uint16_t UV = V;
#if __has_builtin(__builtin_bswap16)
    return __builtin_bswap16(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    // DLL 版のランタイムにはこれらの関数がない（バグ!?）が、
    // リリースビルドではどのみち BSWAP 命令に置き換えられる。
    return _byteswap_ushort(UV);
#else
    uint16_t Hi = UV << 8;
    uint16_t Lo = UV >> 8;
    return Hi | Lo;
#endif
  } else if constexpr (sizeof(T) == 4) {
    uint32_t UV = V;
#if __has_builtin(__builtin_bswap32)
    return __builtin_bswap32(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_ulong(UV);
#else
    uint32_t Byte0 = UV & 0x000000FF;
    uint32_t Byte1 = UV & 0x0000FF00;
    uint32_t Byte2 = UV & 0x00FF0000;
    uint32_t Byte3 = UV & 0xFF000000;
    return (Byte0 << 24) | (Byte1 << 8) | (Byte2 >> 8) | (Byte3 >> 24);
#endif
  } else if constexpr (sizeof(T) == 8) {
    uint64_t UV = V;
#if __has_builtin(__builtin_bswap64)
    return __builtin_bswap64(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    return _byteswap_uint64(UV);
#else
    uint64_t Hi = llvm::byteswap<uint32_t>(UV);
    uint32_t Lo = llvm::byteswap<uint32_t>(UV >> 32);
    return (Hi << 32) | Lo;
#endif
  } else {
```

`sizeof(T)` が 1, 2, 4, 8 のどれかで処理を選びます。1 バイトなら入れ替えるものがないので、そのまま返します。

### 2. 使える道具を順に試す

2 バイトの場合はこうなっています。

```cpp:line-numbers=105
  } else if constexpr (sizeof(T) == 2) {
    uint16_t UV = V;
#if __has_builtin(__builtin_bswap16)
    return __builtin_bswap16(UV);
#elif defined(_MSC_VER) && !defined(_DEBUG)
    // DLL 版のランタイムにはこれらの関数がない（バグ!?）が、
    // リリースビルドではどのみち BSWAP 命令に置き換えられる。
    return _byteswap_ushort(UV);
#else
    uint16_t Hi = UV << 8;
    uint16_t Lo = UV >> 8;
    return Hi | Lo;
#endif
```


2, 4, 8 バイトのそれぞれで、次の順に選びます。

1. GCC や Clang の組み込み関数（`__builtin_bswap16/32/64`）
2. MSVC の `_byteswap_*` 関数
3. どちらもなければ、シフトとマスクの自前実装

### 3. 自前実装の中身

```cpp:line-numbers=125
    uint32_t Byte0 = UV & 0x000000FF;
    uint32_t Byte1 = UV & 0x0000FF00;
    uint32_t Byte2 = UV & 0x00FF0000;
    uint32_t Byte3 = UV & 0xFF000000;
    return (Byte0 << 24) | (Byte1 << 8) | (Byte2 >> 8) | (Byte3 >> 24);
```

32 ビットでは、4 つのバイトを AND で 1 つずつ取り出し、それぞれ正しい位置へずらして OR で合わせます。

`0x11223344` の場合:
- `Byte0 = 0x44` → 24 ビット左へ → `0x44000000`
- `Byte1 = 0x3300` → 8 ビット左へ → `0x00330000`
- `Byte2 = 0x220000` → 8 ビット右へ → `0x00002200`
- `Byte3 = 0x11000000` → 24 ビット右へ → `0x00000011`

全部を OR すると `0x44332211` です。

### 4. 64 ビットは 32 ビット 2 回で

```cpp:line-numbers=138
    uint64_t Hi = llvm::byteswap<uint32_t>(UV);
    uint32_t Lo = llvm::byteswap<uint32_t>(UV >> 32);
    return (Hi << 32) | Lo;
```

下位 32 ビットを入れ替えたものを上位へ、上位 32 ビットを入れ替えたものを下位へ置きます。すでにある 32 ビット版を再利用しています。

### 5. それ以外の大きさはエラー

```cpp:line-numbers=143
    static_assert(!sizeof(T *), "Don't know how to handle the given type.");
```

`static_assert(!sizeof(T *), ...)` は、この枝が実際に選ばれたときだけ失敗するように作られたチェックです。`sizeof` は 0 にならないので、常に偽です。`T` に依存する式にしておくことで、選ばれない限りエラーになりません。

## ここがすごい

- **速さと移植性の両立**: 専用命令が使える環境ではそれを使い、使えない環境でも正しく動きます。C++20 の `std::byteswap` が使えない古い環境向けに、同じ名前と意味で提供しています。
- **コンパイル時に分岐が消える**: `if constexpr` と `#if` の組み合わせなので、実際に生成されるのは選ばれた 1 通りのコードだけです。
- **既存の部品を再利用**: 64 ビットの自前版は 32 ビット版を 2 回使うだけで、マスクを 8 個並べる必要がありません。
- **`static_assert(!sizeof(T *))` の小技**: `static_assert(false)` と書くと、古い規格では使われなくても即エラーになります。型に依存させるのは、テンプレートでよく使われる回避策です。

## まとめ

- 環境ごとの最適な実装は、`#if` と組み込み関数の有無で選び分けられる。
- `if constexpr` で型の大きさごとの処理を 1 つの関数にまとめられる。
- バイトの入れ替えは「取り出す → 正しい位置へずらす → OR で合わせる」。
- 大きい版は小さい版の組み合わせで作ると、コードが短く間違いも減る。

