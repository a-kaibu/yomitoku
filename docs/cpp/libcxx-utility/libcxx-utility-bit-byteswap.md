---
title: バイト順の反転を、組み込み関数と if constexpr の階段で型ごとに選ぶ
description: C++23 の std::byteswap。パディングビットを持つ型を static_assert で拒否し、サイズごとに専用の組み込み命令を選ぶ。128 ビットの命令がなければ 64 ビット 2 回に分けて組み立てる。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__bit/byteswap.h
lines: [29, 66]
function: std::byteswap
difficulty: 2
format: 2
tags: [ビット演算, 移植性, 標準ライブラリ]
---
## ひとことで

`byteswap` は整数の **バイトの並び順を逆にする** 関数です。
たとえば 32 ビットの `0x12345678` は `0x78563412` になります。
ネットワーク通信やファイル形式で、バイト順（エンディアン）が違うデータを読み書きするときに使います。

## コード

::: code-group

```cpp:line-numbers=29 [日本語訳]
template <integral _Tp>
[[nodiscard]] constexpr _Tp byteswap(_Tp __val) noexcept {
  // [bit.byteswap]/Mandates: T はパディングビットを持たないこと。
  // bool は例外的に認める: 現行のどの実装も受け付けており、
  // サイズ 1 の恒等変換ではパディングビットが値の位置へ移ることはない。
  // LWG 4583 は、バイト単位にそろったパディングを許すよう緩める提案をしている（例:
  // _BitInt(48) で 2 バイトまるごとがパディングの場合）。決着したら見直すこと。
  static_assert(is_same_v<remove_cv_t<_Tp>, bool> ||
                    numeric_limits<_Tp>::digits + numeric_limits<_Tp>::is_signed == sizeof(_Tp) * CHAR_BIT,
                "std::byteswap requires T to have no padding bits");

  if constexpr (sizeof(_Tp) == 1) {
    return __val;
#  if __has_builtin(__builtin_bswapg)
  } else {
    return __builtin_bswapg(__val);
  }
#  else
  } else if constexpr (sizeof(_Tp) == 2) {
    return __builtin_bswap16(__val);
  } else if constexpr (sizeof(_Tp) == 4) {
    return __builtin_bswap32(__val);
  } else if constexpr (sizeof(_Tp) == 8) {
    return __builtin_bswap64(__val);
#    if _LIBCPP_HAS_INT128
  } else if constexpr (sizeof(_Tp) == 16) {
#      if __has_builtin(__builtin_bswap128)
    return __builtin_bswap128(__val);
#      else
    return (static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val))) << 64) |
           static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val >> 64)));
#      endif // __has_builtin(__builtin_bswap128) の終わり
#    endif   // _LIBCPP_HAS_INT128 の終わり
  } else {
    static_assert(sizeof(_Tp) == 0, "byteswap is unimplemented for integral types of this size");
  }
#  endif     // __has_builtin(__builtin_bswapg) の終わり
}
```

```cpp:line-numbers=29 [原文]
template <integral _Tp>
[[nodiscard]] constexpr _Tp byteswap(_Tp __val) noexcept {
  // [bit.byteswap]/Mandates: T does not have padding bits.
  // bool is grandfathered: every shipping implementation admits it and the
  // size-1 identity path can't shuffle padding bits into value positions.
  // LWG 4583 proposes relaxing this to allow byte-aligned padding (e.g.
  // _BitInt(48) where 2 whole bytes are padding); revisit once it resolves.
  static_assert(is_same_v<remove_cv_t<_Tp>, bool> ||
                    numeric_limits<_Tp>::digits + numeric_limits<_Tp>::is_signed == sizeof(_Tp) * CHAR_BIT,
                "std::byteswap requires T to have no padding bits");

  if constexpr (sizeof(_Tp) == 1) {
    return __val;
#  if __has_builtin(__builtin_bswapg)
  } else {
    return __builtin_bswapg(__val);
  }
#  else
  } else if constexpr (sizeof(_Tp) == 2) {
    return __builtin_bswap16(__val);
  } else if constexpr (sizeof(_Tp) == 4) {
    return __builtin_bswap32(__val);
  } else if constexpr (sizeof(_Tp) == 8) {
    return __builtin_bswap64(__val);
#    if _LIBCPP_HAS_INT128
  } else if constexpr (sizeof(_Tp) == 16) {
#      if __has_builtin(__builtin_bswap128)
    return __builtin_bswap128(__val);
#      else
    return (static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val))) << 64) |
           static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val >> 64)));
#      endif // __has_builtin(__builtin_bswap128)
#    endif   // _LIBCPP_HAS_INT128
  } else {
    static_assert(sizeof(_Tp) == 0, "byteswap is unimplemented for integral types of this size");
  }
#  endif     // __has_builtin(__builtin_bswapg)
}
```

:::

## 前提知識

- **エンディアン**: 複数バイトの数をメモリに並べる順番です。下位バイトを先に置く方式（リトルエンディアン）と、上位バイトを先に置く方式（ビッグエンディアン）があります。
- **`template <integral _Tp>`**: 「整数型だけ受け付ける」という制約（コンセプト）付きのテンプレートです。
- **`static_assert(条件, "メッセージ")`**: コンパイル時に条件を確かめ、偽ならメッセージ付きでコンパイルを止めます。
- **`if constexpr`**: コンパイル時に分岐を決める `if` です。選ばれなかった枝は生成されません。
- **`sizeof(_Tp)`**: 型のバイト数です。
- **`__builtin_bswap32` など**: コンパイラが用意する組み込み関数です。多くの CPU で 1 命令（x86 の `BSWAP` など）になります。
- **`#if __has_builtin(...)`**: プリプロセッサ（コンパイル前の文字置換段階）で、「この組み込み関数があるか」を調べます。
- **パディングビット**: 型のサイズの中で、値を表すのに使われない余りのビットです。

## 何をしているか

### 1. パディングのある型を拒否する

```cpp:line-numbers=36
  static_assert(is_same_v<remove_cv_t<_Tp>, bool> ||
                    numeric_limits<_Tp>::digits + numeric_limits<_Tp>::is_signed == sizeof(_Tp) * CHAR_BIT,
                "std::byteswap requires T to have no padding bits");
```

「値のビット数 + 符号ビット == 型のビット数」を確かめます。`int32_t` なら値が 31 ビット、符号が 1 ビットで、合計 32 ビット = 4 バイト × 8 です。
パディングがあると、反転したときに意味のないビットが値の位置へ移ってしまいます。コメントのとおり、`bool` だけは例外として認めます。1 バイトなので反転しても何も変わらないからです。

### 2. 1 バイトならそのまま

```cpp:line-numbers=40
  if constexpr (sizeof(_Tp) == 1) {
    return __val;
```

並べ替える相手がいないので、`__val` をそのまま返します。

### 3. 汎用の組み込みがあれば使う

```cpp:line-numbers=42
#  if __has_builtin(__builtin_bswapg)
  } else {
    return __builtin_bswapg(__val);
```

新しいコンパイラには、どのサイズでも使える `__builtin_bswapg` があります。あればこれ 1 つで済みます。

### 4. なければサイズごとに選ぶ

```cpp:line-numbers=46
#  else
  } else if constexpr (sizeof(_Tp) == 2) {
    return __builtin_bswap16(__val);
  } else if constexpr (sizeof(_Tp) == 4) {
    return __builtin_bswap32(__val);
  } else if constexpr (sizeof(_Tp) == 8) {
    return __builtin_bswap64(__val);
#    if _LIBCPP_HAS_INT128
  } else if constexpr (sizeof(_Tp) == 16) {
#      if __has_builtin(__builtin_bswap128)
    return __builtin_bswap128(__val);
#      else
    return (static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val))) << 64) |
           static_cast<_Tp>(byteswap(static_cast<uint64_t>(__val >> 64)));
#      endif // __has_builtin(__builtin_bswap128) の終わり
#    endif   // _LIBCPP_HAS_INT128 の終わり
  } else {
```

2、4、8 バイトにはそれぞれ専用の組み込みがあります。`if constexpr` の階段で、型のサイズに合うものを 1 つだけ選びます。

16 バイト（128 ビット）では、`__builtin_bswap128` がないこともあります。そのときは次の式で **下位 64 ビットを反転したものを上位に**、**上位 64 ビットを反転したものを下位に** 置きます。8 バイトずつの 2 ブロックに分けて反転し、ブロックの位置も入れ替えれば全体の反転になります。

### 5. 想定外のサイズ

```cpp:line-numbers=62
  } else {
    static_assert(sizeof(_Tp) == 0, "byteswap is unimplemented for integral types of this size");
  }
```

`static_assert(sizeof(_Tp) == 0, ...)` は常に偽です。ただし `if constexpr` の枝の中にあり、テンプレートの型に依存するので、**この枝が実際に選ばれたときだけ** エラーになります。

## ここがすごい

- **使える命令を段階的に探す**: まず汎用の組み込み、次にサイズ別、最後に自前の組み立て。コンパイラの世代が違っても動き、速い命令があれば必ずそれを使います。移植性と性能の両立のよい例です。
- **128 ビットを分割統治で解く**: 「上下を入れ替えて、それぞれを反転」という再帰的な見方で、既存の 64 ビット版を再利用しています。
- **間違った使い方をコンパイル時に止める**: パディングのある型や想定外のサイズを、実行時ではなく `static_assert` で弾きます。誤った結果を黙って返すよりずっと安全です。
- **規格の議論までコメントに残す**: 冒頭のコメントは、規格の課題（LWG 4583）を挙げて「将来見直す」と書いています。なぜ今この制限なのかが、後から読む人にわかります。

素直にループで 1 バイトずつ入れ替えることもできますが、コンパイラが 1 命令に置き換えてくれる保証はありません。組み込み関数を明示することで、意図が確実に伝わります。

## まとめ

- バイト順の反転は、多くの CPU で 1 命令になる。組み込み関数で直接呼ぶのが確実。
- `if constexpr` の階段で、型の大きさに応じた実装をコンパイル時に選べる。
- 大きな値は「半分ずつ反転して上下を入れ替える」で組み立てられる。
- `static_assert(sizeof(T) == 0, ...)` は、選ばれたときだけ失敗する枝の定番の書き方。
