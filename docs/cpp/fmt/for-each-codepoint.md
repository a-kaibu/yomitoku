---
title: 4 バイト先読みデコーダを安全に回すための「ゼロ埋めの小部屋」
description: UTF-8 文字列を 1 文字ずつコールバックに渡す関数。必ず 4 バイト読む高速デコーダを使うため、末尾の数バイトだけはゼロで埋めた小さな配列にコピーしてから読む。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [632, 667]
function: detail::for_each_codepoint
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 防御的プログラミング, クロージャ]
---

## ひとことで

`for_each_codepoint(s, f)` は、UTF-8 の文字列 `s` を **1 文字（コードポイント）ずつ** 取り出し、関数 `f` に渡します。文字幅を数えたり、エスケープが必要な文字を探したりするのに使われます。

使っているデコーダ `utf8_decode` は、速さのために **文字の長さに関係なく毎回 4 バイト読む** 作りです。この関数の工夫は、文字列の末尾でバッファの外を読まないための段取りにあります。

## コード

::: code-group

```cpp:line-numbers=632 [日本語訳]
// s の各コードポイント cp について f(cp, sv) を呼ぶ。sv はその
// コードポイントに対応する string_view。エラー時の cp は invalid_code_point。
template <typename F>
FMT_CONSTEXPR void for_each_codepoint(string_view s, F f) {
  auto decode = [f](const char* buf_ptr, const char* ptr) {
    auto cp = uint32_t();
    auto error = 0;
    auto end = utf8_decode(buf_ptr, &cp, &error);
    bool result = f(error ? invalid_code_point : cp,
                    string_view(ptr, error ? 1 : to_unsigned(end - buf_ptr)));
    return result ? (error ? buf_ptr + 1 : end) : nullptr;
  };

  auto p = s.data();
  const size_t block_size = 4;  // utf8_decode は常に 4 文字ずつ読む。
  if (s.size() >= block_size) {
    for (auto end = p + s.size() - block_size + 1; p < end;) {
      p = decode(p, p);
      if (!p) return;
    }
  }
  auto num_chars_left = to_unsigned(s.data() + s.size() - p);
  if (num_chars_left == 0) return;

  // GCC の誤った -Wstringop-overflow 警告を抑える。
  if (FMT_GCC_VERSION) num_chars_left &= 3;
  char buf[2 * block_size - 1] = {};
  copy<char>(p, p + num_chars_left, buf);
  const char* buf_ptr = buf;
  do {
    auto end = decode(buf_ptr, p);
    if (!end) return;
    p += end - buf_ptr;
    buf_ptr = end;
  } while (buf_ptr < buf + num_chars_left);
}
```

```cpp:line-numbers=632 [原文]
// Invokes f(cp, sv) for every code point cp in s with sv being the string view
// corresponding to the code point. cp is invalid_code_point on error.
template <typename F>
FMT_CONSTEXPR void for_each_codepoint(string_view s, F f) {
  auto decode = [f](const char* buf_ptr, const char* ptr) {
    auto cp = uint32_t();
    auto error = 0;
    auto end = utf8_decode(buf_ptr, &cp, &error);
    bool result = f(error ? invalid_code_point : cp,
                    string_view(ptr, error ? 1 : to_unsigned(end - buf_ptr)));
    return result ? (error ? buf_ptr + 1 : end) : nullptr;
  };

  auto p = s.data();
  const size_t block_size = 4;  // utf8_decode always reads blocks of 4 chars.
  if (s.size() >= block_size) {
    for (auto end = p + s.size() - block_size + 1; p < end;) {
      p = decode(p, p);
      if (!p) return;
    }
  }
  auto num_chars_left = to_unsigned(s.data() + s.size() - p);
  if (num_chars_left == 0) return;

  // Suppress bogus -Wstringop-overflow.
  if (FMT_GCC_VERSION) num_chars_left &= 3;
  char buf[2 * block_size - 1] = {};
  copy<char>(p, p + num_chars_left, buf);
  const char* buf_ptr = buf;
  do {
    auto end = decode(buf_ptr, p);
    if (!end) return;
    p += end - buf_ptr;
    buf_ptr = end;
  } while (buf_ptr < buf + num_chars_left);
}
```

:::

## 前提知識

- **UTF-8**: 1 文字を 1〜4 バイトで表す文字コードです。`a` は 1 バイト、`é` は 2 バイト、`あ` は 3 バイト、絵文字は 4 バイトです。
- **ラムダ式 `[f](...) { ... }`**: その場で作る無名関数です。`[f]` は「外側の変数 `f` をコピーして中で使う」という指定（キャプチャ）です。
- **テンプレート引数 `F`**: `f` には「`(uint32_t, string_view)` を受け取って `bool` を返すもの」なら何でも渡せます。ラムダでも関数オブジェクトでも構いません。
- **`string_view`**: 文字列をコピーせず「先頭ポインタと長さ」だけで指す軽い型です。`string_view(ptr, n)` で ptr から n 文字を指します。
- **`nullptr`**: どこも指さないポインタです。ここでは「もう止めて」の合図に使っています。
- **`char buf[7] = {};`**: `{}` で初期化すると全要素が 0 になります。
- **ポインタの引き算 `end - buf_ptr`**: 2 つのポインタの間に何要素あるかを返します。

## 何をしているか

### 1. 1 文字ぶんの処理をラムダにまとめる

```cpp:line-numbers=636
  auto decode = [f](const char* buf_ptr, const char* ptr) {
    auto cp = uint32_t();
    auto error = 0;
    auto end = utf8_decode(buf_ptr, &cp, &error);
    bool result = f(error ? invalid_code_point : cp,
                    string_view(ptr, error ? 1 : to_unsigned(end - buf_ptr)));
    return result ? (error ? buf_ptr + 1 : end) : nullptr;
  };
```

`decode(buf_ptr, ptr)` は、`buf_ptr` から 1 文字デコードし、`f` を呼びます。引数が 2 つあるのは、**読む場所**（`buf_ptr`）と **f に見せる元の文字列の場所**（`ptr`）を分けるためです。

- デコードに失敗したら、コードポイントは `invalid_code_point`、長さは 1 として `f` に渡し、1 バイトだけ進みます。
- `f` が `false` を返したら `nullptr` を返して、全体の処理を止めます。

### 2. 4 バイト以上残っている間は直接読む

```cpp:line-numbers=645
  auto p = s.data();
  const size_t block_size = 4;  // utf8_decode は常に 4 文字ずつ読む。
  if (s.size() >= block_size) {
    for (auto end = p + s.size() - block_size + 1; p < end;) {
      p = decode(p, p);
      if (!p) return;
    }
  }
```

`end = p + s.size() - 4 + 1` は「ここから 4 バイト読んでも、はみ出さない最後の位置の次」です。`p` がそこより前にある間は、元の文字列をそのまま読んでも安全です。

### 3. 残り 3 バイト以下はゼロ埋めの配列にコピー

```cpp:line-numbers=653
  auto num_chars_left = to_unsigned(s.data() + s.size() - p);
  if (num_chars_left == 0) return;

  // GCC の誤った -Wstringop-overflow 警告を抑える。
  if (FMT_GCC_VERSION) num_chars_left &= 3;
  char buf[2 * block_size - 1] = {};
  copy<char>(p, p + num_chars_left, buf);
  const char* buf_ptr = buf;
  do {
    auto end = decode(buf_ptr, p);
    if (!end) return;
    p += end - buf_ptr;
    buf_ptr = end;
  } while (buf_ptr < buf + num_chars_left);
```

`"aé"`（バイト列 `61 C3 A9`、3 バイト）の例で追います。

1. 3 バイトしかないので 2. のループは回りません。
2. 7 バイトの `buf` を 0 で作り、`61 C3 A9` をコピーします。後ろは `00 00 00 00` です。
3. `decode(buf, p)` で `a` を読み、`f(0x61, "a")` を呼びます。戻り値は `buf + 1`。`p` も 1 進めます。
4. `decode(buf + 1, p)` で `é` を読み、`f(0xE9, "é")`。`buf_ptr` は `buf + 3` になり、ループを抜けます。

`f` に渡す `string_view` は元の文字列 `p` を指しているので、呼び出し側から見れば最初から最後まで元の文字列を指したままです。

## ここがすごい

- **速いデコーダの制約を外側で吸収**: 分岐なしのデコーダは「後ろに少なくとも 3 バイトの余白があること」を前提にしています。この関数は、ほとんどの部分では元の文字列を直接読み、**最後の数バイトだけ** をコピーして余白を作ります。全体をコピーするより安く、範囲外読み出しも起きません。
- **配列が 7 バイトの理由**: 残りは最大 3 バイトで、そこから 4 バイト読むので、`3 + 4 = 7` バイトあれば足ります（`2 * block_size - 1`）。
- **途中で止められる**: コールバックが `bool` を返す設計なので、「表示幅が上限に達したら終わり」のような処理を無駄なく書けます。
- **コンパイラの誤警告への対処**: `num_chars_left &= 3` は値を変えません（もともと 3 以下）。GCC に「3 以下だ」と教えて、誤った警告を止めるためのものです。

## まとめ

- 「必ず N バイト読む」高速な処理は、末尾だけ別扱いにすると安全に使える。
- 読む場所と、利用者に見せる場所を分けると、コピーしても元の位置を返せる。
- コールバックの戻り値で「続ける / 止める」を伝える設計は使いやすい。
- 無効なバイト列も 1 バイトずつ進めて報告すれば、処理が止まらない。
