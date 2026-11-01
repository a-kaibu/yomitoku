---
title: 「{」と「}」だけを見て書式文字列を切り分けるイベント駆動パーサ
description: '"Hello, {}!" のような書式文字列を、地の文と置換フィールドに分ける関数。見つけたものをハンドラに通知するだけにして、実行時の整形にもコンパイル時の検査にも同じパーサを使う。'
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/core.h
lines: [1642, 1660]
function: detail::parse_format_string
difficulty: 1
format: 2
tags: [パース, 設計パターン, API設計]
---

## ひとことで

`fmt::format("x = {}, y = {:>5}", x, y)` の書式文字列は、そのまま出力する **地の文**（`"x = "` や `", y = "`）と、値を入れる **置換フィールド**（`{}` や `{:>5}`）からできています。

`parse_format_string` は文字列を先頭から読んで、この 2 つを切り分けます。見つけたものは `handler` に「地の文がありました」「フィールドがありました」と知らせるだけで、何をするかは `handler` 次第です。

## コード

```cpp:line-numbers=1642
template <typename Char, typename Handler>
FMT_CONSTEXPR void parse_format_string(basic_string_view<Char> fmt,
                                       Handler&& handler) {
  auto begin = fmt.data(), end = begin + fmt.size();
  auto p = begin;
  while (p != end) {
    auto c = *p++;
    if (c == '{') {
      handler.on_text(begin, p - 1);
      begin = p = parse_replacement_field(p - 1, end, handler);
    } else if (c == '}') {
      if (p == end || *p != '}')
        return handler.on_error("unmatched '}' in format string");
      handler.on_text(begin, p);
      begin = ++p;
    }
  }
  handler.on_text(begin, end);
}
```

## 前提知識

- **`basic_string_view<Char>`**: 文字列をコピーせずに「先頭と長さ」で指す型です。`fmt.data()` が先頭のポインタ、`fmt.size()` が長さです。
- **`Handler&& handler`**: テンプレートの引数で、`on_text` や `on_error` などの関数を持つものなら何でも受け取れます。`&&` はここでは「左辺値も右辺値も受け取れる参照」（フォワーディング参照）です。
- **`auto c = *p++;`**: `p` の指す文字を読んでから、`p` を 1 つ進めます。
- **`handler.on_text(begin, p - 1)`**: `[begin, p - 1)`、つまり `{` の直前までを地の文として通知します。範囲は「始まりを含み、終わりを含まない」形です。
- **`return f();`**: 戻り値のない（`void`）関数でも、`void` を返す式なら `return` できます。エラーを通知してそのまま抜けています。

## 何をしているか

`"a}}b{0}c"` で追います。

### 1. `{` を見つけたら置換フィールドを読む

```cpp:line-numbers=1648
    auto c = *p++;
    if (c == '{') {
      handler.on_text(begin, p - 1);
```

`{` までの地の文を通知し、`{` からあとは `parse_replacement_field` に任せます。戻り値は `}` の次の位置なので、そこから読み直します。`{{`（`{` そのものを出したいときの書き方）も、この関数の中で地の文として処理されます。

例では `{0}` のところで `on_text("b")` のあと、引数 0 番のフィールドが通知されます。

### 2. `}` は必ず `}}` でなければならない

```cpp:line-numbers=1651
      begin = p = parse_replacement_field(p - 1, end, handler);
    } else if (c == '}') {
      if (p == end || *p != '}')
        return handler.on_error("unmatched '}' in format string");
      handler.on_text(begin, p);
      begin = ++p;
```

置換フィールドの外で `}` が出てきたら、次も `}` のはずです（`}}` で `}` 1 文字を表す決まり）。そうでなければエラーです。

正しい `}}` なら、`begin` から 1 つ目の `}` までを地の文として通知し、2 つ目の `}` を飛ばします。例では `on_text("a}")` が通知されます。

### 3. 残りを通知する

```cpp:line-numbers=1659
  handler.on_text(begin, end);
```

最後の `"c"` を地の文として通知して終わりです。全体の通知は `on_text("a}")`、`on_text("b")`、フィールド 0、`on_text("c")` となり、出力は `a}b<引数0>c` になります。

## ここがすごい

- **見るのは 2 文字だけ**: 地の文の中では `{` と `}` 以外は気にしないので、ループは単純で速いです。地の文はまとめて 1 回で通知されるので、1 文字ずつのコピーもありません。
- **パーサと処理を分ける**: パーサは「何があったか」を伝えるだけです。同じパーサを、実行時に文字列を組み立てる `handler` にも、**コンパイル時に書式文字列と引数の型が合っているかを検査する** `handler`（`format_string_checker`）にも使っています。`constexpr` 関数なので、検査はコンパイル時に行えます。
- **エラー処理も handler 任せ**: 実行時なら例外、コンパイル時ならコンパイルエラー、と、エラーの扱いも `handler.on_error` 次第です。
- **`{{` と `}}` の非対称な扱い**: `{` は置換フィールドの始まりかもしれないので専用の関数に渡し、`}` は外にあれば `}}` しかありえないのでここで処理しています。それぞれ最も簡単な場所で扱っています。

## まとめ

- パーサは「何を見つけたか」を通知するだけにすると、用途の違う処理で使い回せる。
- 区切り文字だけを探し、その間はまとめて扱うと、ループが単純で速くなる。
- 同じパーサを実行時の処理とコンパイル時の検査の両方に使える。
- 範囲は「始まりを含み、終わりを含まない」で渡すと、長さの計算がずれにくい。
