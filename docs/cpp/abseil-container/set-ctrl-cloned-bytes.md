---
title: 分岐なしで「末尾のコピー」も更新する、制御バイトの書き込み
description: SwissTable は配列の先頭 15 バイトを末尾にも複製している。1 バイト書くたびにその複製も保つ処理を、if を使わずポインタの選択だけで書いた関数。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/raw_hash_set.cc
lines: [555, 568]
function: SetCtrlNoSanitizeImpl
difficulty: 2
tags: [ハック, データ構造, 最適化, メモリ管理]
---

## ひとことで

SwissTable は、制御バイトを 16 個まとめて読み込んで調べます。配列の末尾近くから 16 個読むと、はみ出した分は「先頭に戻った続き」であってほしいので、**先頭 15 個の制御バイトのコピーを、配列の末尾にも置いています**。
`SetCtrlNoSanitizeImpl` は制御バイトを 1 つ書き換える関数で、書き換えた場所がコピー対象なら末尾のコピーも更新します。
その「対象なら」を **if 文ではなく、書き込み先ポインタの選択** で表しているのが見どころです。

## コード

::: code-group

```cpp:line-numbers=555 [日本語訳]
// `ctrl[i]` を `h` にする。
//
// 直接代入するのと違い、この関数は範囲チェックを行い、必要なら
// 末尾の複製領域にも値を反映する。
inline void SetCtrlNoSanitizeImpl(size_t cap, ctrl_t* ctrl, size_t i,
                                  ctrl_t h) {
  ABSL_SWISSTABLE_ASSERT(i < cap);
  // 添字ではなく基準ポインタを選ぶことで、`ctrl + cap + 1` が `i` に
  // 依存しなくなる。インライン化されたとき `slot_array` の `ctrl + cap` を再利用でき、
  // ループの外に追い出せる。
  ctrl_t* cloned_ctrl_base = i < NumClonedBytes() ? ctrl + cap + 1 : ctrl;
  ctrl[i] = h;
  cloned_ctrl_base[i] = h;
}
```

```cpp:line-numbers=555 [原文]
// Sets `ctrl[i]` to `h`.
//
// Unlike setting it directly, this function will perform bounds checks and
// mirror the value to the cloned tail if necessary.
inline void SetCtrlNoSanitizeImpl(size_t cap, ctrl_t* ctrl, size_t i,
                                  ctrl_t h) {
  ABSL_SWISSTABLE_ASSERT(i < cap);
  // Select the base pointer rather than the index so `ctrl + cap + 1` does not
  // depend on `i`. When inlined, it can reuse `ctrl + cap` from `slot_array`
  // and be hoisted out of loops.
  ctrl_t* cloned_ctrl_base = i < NumClonedBytes() ? ctrl + cap + 1 : ctrl;
  ctrl[i] = h;
  cloned_ctrl_base[i] = h;
}
```

:::

## 前提知識

- **ポインタ `ctrl_t* ctrl`**: 制御バイトの配列の先頭を指す値です。`ctrl + n` は先頭から `n` 個先の要素を指すポインタになります。
- **`ptr[i]`**: `*(ptr + i)` と同じ意味で、ポインタから `i` 個先の要素を読み書きします。
- **`inline`**: 関数を呼び出し元に展開してよい、というコンパイラへのヒントです（ヘッダで定義しても重複エラーにならない、という意味もあります）。
- **三項演算子 `a ? b : c`**: ここではポインタを 2 つのうちどちらにするかを選ぶのに使っています。
- **`NumClonedBytes()`**: `Group::kWidth - 1`、つまり SSE2 環境では 15 を返す `constexpr` 関数です。
- **メモリの並び**: 制御バイトの配列は `ctrl[0..cap-1]`（本物）、`ctrl[cap]`（番兵）、`ctrl[cap+1 .. cap+15]`（先頭 15 個のコピー）の順に並んでいます（ファイル `raw_hash_set.h` の冒頭のコメントにある構造です）。

## 何をしているか

容量 `cap = 31` の表で考えます。コピーは `ctrl[32]`〜`ctrl[46]` にあり、`ctrl[32 + i]` が `ctrl[i]`（`i < 15`）のコピーです。

### 1. 書き込み先の「基準」を選ぶ

```cpp:line-numbers=565
  ctrl_t* cloned_ctrl_base = i < NumClonedBytes() ? ctrl + cap + 1 : ctrl;
```

```
i < 15 なら cloned_ctrl_base = ctrl + cap + 1   （コピー領域の先頭）
そうでなければ cloned_ctrl_base = ctrl           （本物の配列の先頭）
```

### 2. 2 回書く

```cpp:line-numbers=566
  ctrl[i] = h;
  cloned_ctrl_base[i] = h;
```

`ctrl[i] = h` で本物を書き、`cloned_ctrl_base[i] = h` でもう 1 回書きます。

- `i = 3` のとき: `ctrl[3]` と `ctrl[35]` に書きます。コピーも最新になります。
- `i = 20` のとき: 基準が `ctrl` なので、2 回目も `ctrl[20]` です。**同じ場所に同じ値を 2 回書くだけ** で、害はありません。

どちらの場合も命令の流れは同じで、「どこに 2 回目を書くか」だけが変わります。

## ここがすごい

- **分岐を「データの選択」に変える**: 素直に書くと `if (i < 15) ctrl[cap + 1 + i] = h;` です。ここでは条件分岐を、ポインタの選択に置き換えています。選択は条件付き移動命令などで分岐なしに実行できるので、分岐予測を外して遅くなる心配が減ります。
- **無駄な書き込みを許す**: 同じ場所に 2 回書くのは一見ムダですが、メモリ上の 1 バイトの上書きはとても安く、分岐を消せる利益のほうが大きい、という判断です。
- **ループの外に出せる形にする**: 関数内のコメントは、添字ではなく基準ポインタを選ぶ理由を述べています。`ctrl + cap + 1` が `i` に依存しないので、インライン展開されたときにループの外へ計算を追い出せる（hoist できる）のです。
- **複製で境界処理を消す**: そもそも末尾のコピーがあるおかげで、検索側は「配列の端をまたぐ 16 バイト読み込み」を特別扱いせずに済んでいます。書き込み側が少しだけ働いて、頻度の高い読み込み側を単純にしています。

## まとめ

- 「条件によって書き込み先が変わる」処理は、ポインタを選んでから無条件に書く形にすると分岐を消せる。
- 同じ値を同じ場所に書き直すのは無害なので、分岐を消すための手段として使える。
- 環状バッファの端の処理は、先頭の一部を末尾に複製すると読み込み側から消せる。
- ループ内で変わらない計算は、コンパイラが外に出せる書き方にしておくとよい。
