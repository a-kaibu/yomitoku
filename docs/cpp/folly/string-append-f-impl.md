---
title: printf 風の書式化を、まずスタックの 128 バイトで試してみる
description: printf と同じ書式で std::string に追記する stringAppendf の実装。まず小さなスタック上のバッファで vsnprintf を呼び、収まらなかったときだけ必要な大きさをヒープに確保してやり直す。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/String.cpp
lines: [169, 224]
function: folly::stringAppendfImpl
difficulty: 2
format: 2
tags: [文字列処理, メモリ管理, エラー処理]
---

## ひとことで

`folly::stringPrintf("%d items", n)` や `stringAppendf(&s, "x=%f", x)` は、C の `printf` と同じ書式で文字列を作る関数です。その中身が `stringAppendfImpl` です。

ポイントは、**ほとんどの書式化結果は短い** という前提で、まずスタック上の 128 バイトのバッファで書いてみることです。足りなかったときだけ、ちょうどの大きさをヒープに確保して書き直します。

## コード

::: code-group

```cpp:line-numbers=169 [日本語訳]
int stringAppendfImplHelper(
    char* buf, size_t bufsize, const char* format, va_list args) {
  va_list args_copy;
  va_copy(args_copy, args);
  int bytes_used = vsnprintf(buf, bufsize, format, args_copy);
  va_end(args_copy);
  return bytes_used;
}

void stringAppendfImpl(std::string& output, const char* format, va_list args) {
  // とても単純。まずインラインのバッファを使って確保を避けようとする。
  // そのバッファに出力が収まらなければ、ヒープに確保して
  // そちらを使う。
  //
  // このバッファの適切な大きさは推測しにくい。書式文字の数や
  // コードベースの静的解析に基づく経験則も考えられる。
  // あるいは、単純な場合（たとえば端末 1 行ぶんのテキスト）に十分で、
  // スタック変数として心配になるほどは大きくない数を
  // 選んでしまえばよい。
  //
  std::array<char, 128> inline_buffer;

  int bytes_used = stringAppendfImplHelper(
      inline_buffer.data(), inline_buffer.size(), format, args);
  if (bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; snprintf returned negative "
            "with format string: ",
            format));
  }

  if (static_cast<size_t>(bytes_used) < inline_buffer.size()) {
    output.append(inline_buffer.data(), size_t(bytes_used));
    return;
  }

  // 収まらなかった。仕方ないのでヒープにバッファを確保する。
  std::unique_ptr<char[]> heap_buffer(new char[size_t(bytes_used + 1)]);
  int final_bytes_used = stringAppendfImplHelper(
      heap_buffer.get(), size_t(bytes_used + 1), format, args);
  if (final_bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; second snprintf returned negative "
            "with format string: ",
            format));
  }
  // たとえば幅指定を使って、ヌル終端文字を含む文字列バッファを
  // 出力した場合などは、2 回目の呼び出しのほうが短くなることがある。
  // vsnprintf("%.*s", buf.size(), buf)
  CHECK(bytes_used >= final_bytes_used);

  // 末尾の '\0' は出力文字列に含めない
  output.append(heap_buffer.get(), size_t(final_bytes_used));
}
```

```cpp:line-numbers=169 [原文]
int stringAppendfImplHelper(
    char* buf, size_t bufsize, const char* format, va_list args) {
  va_list args_copy;
  va_copy(args_copy, args);
  int bytes_used = vsnprintf(buf, bufsize, format, args_copy);
  va_end(args_copy);
  return bytes_used;
}

void stringAppendfImpl(std::string& output, const char* format, va_list args) {
  // Very simple; first, try to avoid an allocation by using an inline
  // buffer.  If that fails to hold the output string, allocate one on
  // the heap, use it instead.
  //
  // It is hard to guess the proper size of this buffer; some
  // heuristics could be based on the number of format characters, or
  // static analysis of a codebase.  Or, we can just pick a number
  // that seems big enough for simple cases (say, one line of text on
  // a terminal) without being large enough to be concerning as a
  // stack variable.
  std::array<char, 128> inline_buffer;

  int bytes_used = stringAppendfImplHelper(
      inline_buffer.data(), inline_buffer.size(), format, args);
  if (bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; snprintf returned negative "
            "with format string: ",
            format));
  }

  if (static_cast<size_t>(bytes_used) < inline_buffer.size()) {
    output.append(inline_buffer.data(), size_t(bytes_used));
    return;
  }

  // Couldn't fit.  Heap allocate a buffer, oh well.
  std::unique_ptr<char[]> heap_buffer(new char[size_t(bytes_used + 1)]);
  int final_bytes_used = stringAppendfImplHelper(
      heap_buffer.get(), size_t(bytes_used + 1), format, args);
  if (final_bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; second snprintf returned negative "
            "with format string: ",
            format));
  }
  // The second call can take fewer bytes if, for example, we were printing a
  // string buffer with null-terminating char using a width specifier -
  // vsnprintf("%.*s", buf.size(), buf)
  CHECK(bytes_used >= final_bytes_used);

  // We don't keep the trailing '\0' in our output string
  output.append(heap_buffer.get(), size_t(final_bytes_used));
}
```

:::

## 前提知識

- **`va_list`**: C の可変長引数（`printf(fmt, ...)` の `...` 部分）を扱うための型です。引数を 1 つずつ読み進める「カーソル」のようなものです。
- **`va_copy` / `va_end`**: `va_list` は **一度読み進めると再利用できない** ことがあるので、もう一度使いたいときは `va_copy` で複製します。使い終わったら `va_end` で片付けます。
- **`vsnprintf(buf, size, fmt, args)`**: `va_list` 版の `snprintf` です。`buf` に最大 `size - 1` 文字と終端の `'\0'` を書きます。戻り値は **バッファが十分大きかったら書けたはずの文字数**（終端を除く）です。エラーなら負の値です。
- **`std::array<char, 128>`**: 大きさ 128 の固定長配列です。ローカル変数なので **スタック** に置かれ、確保も解放もほぼタダです。
- **`std::unique_ptr<char[]>`**: `new[]` で確保した配列を持ち、スコープを抜けると自動で `delete[]` するスマートポインタです。例外が起きても解放漏れがありません。
- **無名名前空間 `namespace { ... }`**: 中の関数をこのファイルの中だけで使えるようにします。
- **`CHECK(条件)`**: Google の glog ライブラリのマクロで、条件が偽ならプログラムを停止します。

## 何をしているか

### 1. va_list を壊さないための補助関数

```cpp:line-numbers=169
int stringAppendfImplHelper(
    char* buf, size_t bufsize, const char* format, va_list args) {
  va_list args_copy;
  va_copy(args_copy, args);
  int bytes_used = vsnprintf(buf, bufsize, format, args_copy);
  va_end(args_copy);
  return bytes_used;
}
```

`stringAppendfImplHelper` は、渡された `args` をいったん `va_copy` で複製してから `vsnprintf` に渡します。元の `args` は読み進められないので、**同じ引数でもう一度書式化** できます。

### 2. まずスタックで試す

```cpp:line-numbers=189
  std::array<char, 128> inline_buffer;

  int bytes_used = stringAppendfImplHelper(
      inline_buffer.data(), inline_buffer.size(), format, args);
  if (bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; snprintf returned negative "
            "with format string: ",
            format));
  }

  if (static_cast<size_t>(bytes_used) < inline_buffer.size()) {
    output.append(inline_buffer.data(), size_t(bytes_used));
    return;
  }
```

`stringAppendf(&s, "id=%d", 42)` の場合で追います。

- 128 バイトのバッファに `"id=42"` が書かれ、戻り値は `5`
- `5 < 128` なので、`output.append` で 5 文字を追記して終わり

ヒープ確保は 1 回も起きません。

### 3. 足りなければヒープでやり直す

```cpp:line-numbers=207
  std::unique_ptr<char[]> heap_buffer(new char[size_t(bytes_used + 1)]);
  int final_bytes_used = stringAppendfImplHelper(
      heap_buffer.get(), size_t(bytes_used + 1), format, args);
  if (final_bytes_used < 0) {
    throw std::runtime_error(
        to<std::string>(
            "Invalid format string; second snprintf returned negative "
            "with format string: ",
            format));
  }
  // The second call can take fewer bytes if, for example, we were printing a
  // string buffer with null-terminating char using a width specifier -
  // vsnprintf("%.*s", buf.size(), buf)
  CHECK(bytes_used >= final_bytes_used);

  // We don't keep the trailing '\0' in our output string
  output.append(heap_buffer.get(), size_t(final_bytes_used));
```

長い文字列 `%s` を含み、結果が 300 文字になる場合です。

- 1 回目の `vsnprintf` は 127 文字までしか書けませんが、戻り値で「本当は 300 文字必要」とわかります。
- `300 + 1`（終端の分）バイトをヒープに確保し、同じ引数で 2 回目を呼びます。
- 書けた 300 文字を `output` に追記します。`'\0'` は含めません。

### 4. エラーと「2 回目のほうが短い」場合

戻り値が負なら書式文字列が不正なので、例外を投げます。

コメントによると、`"%.*s"` のように幅を指定して途中に `'\0'` を含むバッファを出力する場合などに、2 回目の結果が短くなることがあります。そこで「2 回目は 1 回目以下」であることだけを `CHECK` し、実際に書けた長さ `final_bytes_used` を使っています。

## ここがすごい

- **よくある場合を最速にする**: ログ 1 行のような短い文字列なら、ヒープ確保なしで済みます。コメントは、128 バイトを「端末 1 行ぶんくらいの、スタックに置いても心配のない大きさ」として選んだと説明しています。
- **2 回目で必ず足りる**: `vsnprintf` の戻り値は「必要な長さ」なので、2 回目はちょうどの大きさで確保できます。バッファを 2 倍ずつ広げて何度も試す方法より無駄がありません。
- **`va_copy` を忘れない**: 同じ `va_list` を 2 回 `vsnprintf` に渡すのは、多くの環境で未定義動作です。たまたま x86 で動いても、別の CPU で壊れる種類のバグです。補助関数に `va_copy` を閉じ込めているので、呼ぶ側はそれを気にせずに済みます。
- **後片付けを自動化**: ヒープのバッファは `unique_ptr` が持つので、例外を投げる経路でも解放が漏れません。

## まとめ

- 結果の長さがわからない処理は、まず小さな固定バッファで試し、足りなければやり直す。
- `vsnprintf` の戻り値は「必要な長さ」なので、やり直しは 1 回で済む。
- `va_list` を 2 回使うなら、毎回 `va_copy` で複製する。
- ヒープのバッファは `std::unique_ptr` に持たせると解放漏れがない。
