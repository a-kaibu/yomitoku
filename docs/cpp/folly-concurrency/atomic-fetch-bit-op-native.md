---
title: マクロ 1 つで 9 通りの「lock bts」命令を生成するインラインアセンブリ
description: x86 のビット操作命令 bts・btr・btc を、整数の幅 3 通りぶんマクロで展開する関数オブジェクト。キャリーフラグを直接 bool として受け取る技も見どころ。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/AtomicUtil-inl.h
lines: [273, 326]
function: detail::atomic_fetch_bit_op_native_do_instr_fn
difficulty: 3
tags: [低レイヤ, マクロ, ビット演算, 並行処理, 最適化]
---

## ひとことで

このコードは、「整数の指定ビットを不可分に 1 にする（または 0 にする、反転する）、そして元のビットの値を返す」操作を、x86 の専用命令で実行するための部品です。
命令は 3 種類（`bts` / `btr` / `btc`）、整数の幅は 3 種類（2 / 4 / 8 バイト）あるので組み合わせは 9 通りです。
それを 1 つのマクロで書き分け、コンパイル時に必要な 1 通りだけを残します。

## コード

```cpp:line-numbers=273
enum class atomic_fetch_bit_op_native_instr_mnem { bts, btr, btc };
enum class atomic_fetch_bit_op_native_instr_suff { w, l, q };

#define FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(mnem, suff)                            \
  if constexpr (                                                              \
      Instr == mnem_t::mnem && sizeof(Int) == 1 << (int(suff_t::suff) + 1)) { \
    if (order == ::std::memory_order_relaxed) {                               \
      asm("lock " #mnem #suff " %[bit], %[ptr]"                               \
          : "=@ccc"(out), [ptr] "+m"(*ptr)                                    \
          : [bit] "ri"(bit));                                                 \
    } else {                                                                  \
      asm volatile(                                                           \
          "lock " #mnem #suff " %[bit], (%[ptr])"                             \
          : "=@ccc"(out)                                                      \
          : [bit] "ri"(bit), [ptr] "r"(ptr)                                   \
          : "memory");                                                        \
    }                                                                         \
  }

template <atomic_fetch_bit_op_native_instr_mnem Instr>
struct atomic_fetch_bit_op_native_do_instr_fn {
  template <typename Int>
  FOLLY_ERASE bool operator()(
      Int* ptr, Int bit, std::memory_order order) const {
    using mnem_t = atomic_fetch_bit_op_native_instr_mnem;
    using suff_t = atomic_fetch_bit_op_native_instr_suff;
    bool out = false;
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, q)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, q)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, q)
    return out;
  }
};
template <atomic_fetch_bit_op_native_instr_mnem Instr>
inline constexpr atomic_fetch_bit_op_native_do_instr_fn<Instr>
    atomic_fetch_bit_op_native_do_instr{};

static constexpr auto& atomic_fetch_bit_op_native_bts =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::bts>;
static constexpr auto& atomic_fetch_bit_op_native_btr =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::btr>;
static constexpr auto& atomic_fetch_bit_op_native_btc =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::btc>;

#undef FOLLY_DETAIL_ATOMIC_BIT_OP_ONE
```

## 前提知識

- **x86 のビット命令**: `bts`（bit test and set）は「指定ビットの今の値をキャリーフラグ（CPU の 1 ビットの状態フラグ）にコピーしてから 1 にする」命令です。`btr` は 0 にし、`btc` は反転します。命令名の後ろの `w` / `l` / `q` は、対象が 2 / 4 / 8 バイトであることを表します。
- **`lock` 接頭辞**: 命令の前に付けると、その読み書きが他の CPU から割り込まれない不可分操作になります。
- **インラインアセンブリ（`asm(...)`）**: C++ の中に機械語命令を直接書く GCC/Clang の拡張機能です。`: 出力 : 入力 : 破壊するもの` の順に、C++ の変数との対応を書きます。
  - `"=@ccc"(out)`: 「命令の後のキャリーフラグ（cc の c）を `out` に入れる」という指定です。
  - `"+m"(*ptr)`: `*ptr` のメモリを読み書きする、という指定です。
  - `"ri"(bit)`: `bit` はレジスタか即値（命令に埋め込む定数）で渡す、という指定です。
  - `"memory"`: この命令が任意のメモリに影響しうるので、前後のメモリアクセスを動かすな、とコンパイラに伝えます。
- **`asm volatile`**: 出力が使われなくても命令を消したり動かしたりしない、という指定です。
- **マクロと `#`**: `#define` で作る文字列置換です。`#mnem` は引数を文字列リテラルにし、`"lock " #mnem #suff` は隣り合う文字列が連結されて `"lock btsq"` などになります。行末の `\` は行の続きを表します。
- **`enum class`**: 名前の衝突しない列挙型です。
- **関数オブジェクト**: `operator()` を持つ構造体で、関数のように呼べます。`inline constexpr` 変数として 1 個だけ作られます。
- **`if constexpr`**: 条件が偽の側をコンパイルしない if 文です。

## 何をしているか

### 1. 名前の部品を列挙型にする

```cpp:line-numbers=273
enum class atomic_fetch_bit_op_native_instr_mnem { bts, btr, btc };
enum class atomic_fetch_bit_op_native_instr_suff { w, l, q };
```

命令名 `bts` / `btr` / `btc` と、幅の接尾辞 `w` / `l` / `q` を `enum class` にしています。
`w = 0`、`l = 1`、`q = 2` という値になる点が後で効きます。

### 2. マクロ 1 つ分の中身

```cpp:line-numbers=276
#define FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(mnem, suff)                            \
  if constexpr (                                                              \
      Instr == mnem_t::mnem && sizeof(Int) == 1 << (int(suff_t::suff) + 1)) { \
    if (order == ::std::memory_order_relaxed) {                               \
      asm("lock " #mnem #suff " %[bit], %[ptr]"                               \
          : "=@ccc"(out), [ptr] "+m"(*ptr)                                    \
          : [bit] "ri"(bit));                                                 \
    } else {                                                                  \
      asm volatile(                                                           \
          "lock " #mnem #suff " %[bit], (%[ptr])"                             \
          : "=@ccc"(out)                                                      \
          : [bit] "ri"(bit), [ptr] "r"(ptr)                                   \
          : "memory");                                                        \
    }                                                                         \
  }
```

`if constexpr` の条件は、「テンプレート引数の `Instr` がこのマクロの命令名と同じ」かつ「整数の大きさが `1 << (接尾辞の値 + 1)` バイト」です。
`w` なら `1 << 1 = 2`、`l` なら `1 << 2 = 4`、`q` なら `1 << 3 = 8` バイトになり、接尾辞と幅がぴったり対応します。

条件を満たすと、メモリオーダーによって 2 通りのアセンブリを出します。

- `relaxed` のとき: `volatile` も `"memory"` も付けません。対象の `*ptr` だけを読み書きすると伝えるので、コンパイラは周りのコードを自由に並べ替えられます。
- それ以外のとき: `asm volatile` と `"memory"` を付け、前後の読み書きを越えて動かないようにします。x86 の `lock` 付き命令はもともと強い順序を持つので、コンパイラさえ止めれば `acquire` や `release` の要求を満たせます。

どちらも `"=@ccc"(out)` でキャリーフラグを直接 `out` に受け取ります。

### 3. 9 回展開する

```cpp:line-numbers=292
template <atomic_fetch_bit_op_native_instr_mnem Instr>
struct atomic_fetch_bit_op_native_do_instr_fn {
  template <typename Int>
  FOLLY_ERASE bool operator()(
      Int* ptr, Int bit, std::memory_order order) const {
    using mnem_t = atomic_fetch_bit_op_native_instr_mnem;
    using suff_t = atomic_fetch_bit_op_native_instr_suff;
    bool out = false;
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, q)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btr, q)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, w)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, l)
    FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(btc, q)
    return out;
  }
};
```

`operator()` の中でマクロを 9 回並べています。
各展開は `if constexpr` なので、たとえば `Instr == bts` で `Int` が `uint64_t` なら、`FOLLY_DETAIL_ATOMIC_BIT_OP_ONE(bts, q)` の分だけが残り、残り 8 つはコンパイルされません。
結果として、関数全体が `lock btsq` 1 命令にまで縮みます。

### 4. 名前を付けて公開し、マクロを消す

```cpp:line-numbers=316
static constexpr auto& atomic_fetch_bit_op_native_bts =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::bts>;
static constexpr auto& atomic_fetch_bit_op_native_btr =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::btr>;
static constexpr auto& atomic_fetch_bit_op_native_btc =
    atomic_fetch_bit_op_native_do_instr<
        atomic_fetch_bit_op_native_instr_mnem::btc>;

#undef FOLLY_DETAIL_ATOMIC_BIT_OP_ONE
```

`atomic_fetch_bit_op_native_bts` などの別名を作り、最後に `#undef` でマクロを消して、ほかのファイルを汚さないようにしています。

## ここがすごい

- **フラグを直接受け取る**: 素直に書くと `bts` の後に `setc` 命令でフラグをレジスタへ移し、それを比較します。`=@ccc` を使うと、コンパイラは後続の `if` を「キャリーなら分岐」という命令に直接つなげられます。
- **標準 C++ では届かない命令を使う**: 標準の `fetch_or(mask) & mask` でも同じ意味になります。しかし同じファイルのコメントによれば、当時 GCC 7 以降はこれを `lock bts` に変換できた一方、Clang はできませんでした。`fetch_or` は古い値を丸ごと返す必要があるので、x86 では CAS のループになりえます。
- **組み合わせ爆発をマクロで畳む**: 9 通りを手で書くと、ほぼ同じアセンブリが 9 回並びます。マクロと `if constexpr` の組み合わせで、1 か所の修正で全部が直るようにしています。
- **オーダーに応じて制約を緩める**: `relaxed` のときは `"memory"` 指定を外し、コンパイラの最適化を邪魔しません。

## まとめ

- x86 には「ビットを変えて元の値を返す」専用の不可分命令がある。
- インラインアセンブリの `=@cc` 指定を使うと、CPU のフラグを直接 `bool` として受け取れる。
- マクロ展開と `if constexpr` を組み合わせると、型の組み合わせごとのコードを 1 か所にまとめられる。
- 局所的なマクロは使い終わったら `#undef` して影響範囲を閉じる。
