---
title: 短い方の長さまで memcmp し、残りは長さで決める文字列比較
description: StringRef::compare は、ヌル終端のない文字列を辞書順で比べます。共通部分を memcmp で比べ、一致したら長さだけで大小を決めます。memcmp の結果は -1/0/1 に整えて返します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/StringRef.h
lines: [174, 187]
function: StringRef::compare
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, イディオム]
---

## ひとことで

`StringRef` は「文字列の先頭の住所」と「長さ」だけを持つ、軽い文字列の参照です。`compare` は 2 つの StringRef を **辞書順** で比べ、小さければ -1、等しければ 0、大きければ 1 を返します。
例: `"apple"` と `"apply"` は -1、`"app"` と `"apple"` も -1 です。

## コード

::: code-group

```cpp:line-numbers=174 [日本語訳]
  /// 2 つの文字列を比べる。この文字列が \p RHS より辞書順で小さい・等しい・
  /// 大きいに応じて、結果は負・0・正になる。
  /// （\p RHS は引数名）
  [[nodiscard]] int compare(StringRef RHS) const {
    // 共通部分に違いがないか調べる。
    if (int Res =
            compareMemory(data(), RHS.data(), std::min(size(), RHS.size())))
      return Res < 0 ? -1 : 1;

    // そうでなければ共通部分は一致しているので、長さだけ調べればよい。
    if (size() == RHS.size())
      return 0;
    return size() < RHS.size() ? -1 : 1;
  }
```

```cpp:line-numbers=174 [原文]
  /// Compare two strings; the result is negative, zero, or positive if this
  /// string is lexicographically less than, equal to, or greater than the
  /// \p RHS.
  [[nodiscard]] int compare(StringRef RHS) const {
    // Check the prefix for a mismatch.
    if (int Res =
            compareMemory(data(), RHS.data(), std::min(size(), RHS.size())))
      return Res < 0 ? -1 : 1;

    // Otherwise the prefixes match, so we only need to check the lengths.
    if (size() == RHS.size())
      return 0;
    return size() < RHS.size() ? -1 : 1;
  }
```

:::

## 前提知識

- **StringRef**: C++ の文字列は、末尾に `\0`（ヌル文字）を置いて終わりを示す方式（C 文字列）がよく使われます。StringRef は長さを別に持つので、`\0` がなくても、文字列の一部分でも指せます。コピーをしないので軽いです。
- **`memcmp(a, b, n)`**: メモリ上の `n` バイトを先頭から比べ、最初に違ったバイトで大小を決める C の関数です。結果は負・0・正の整数で、具体的な値は決まっていません。
- **`if (int Res = ...)`**: `if` の条件の中で変数を宣言し、その値が 0 でなければ真として扱います。変数は `if` の中だけで使えます。
- **`std::min(a, b)`**: 小さい方を返します。
- **`[[nodiscard]]`**: 戻り値を捨てると警告が出る印です。
- **`const` メンバ関数**: 名前の後ろの `const` は「この関数は自分の中身を書き換えない」という約束です。

## 何をしているか

### 1. 共通の長さまで比べる

```cpp:line-numbers=179
    if (int Res =
            compareMemory(data(), RHS.data(), std::min(size(), RHS.size())))
      return Res < 0 ? -1 : 1;
```

`std::min(size(), RHS.size())` で短い方の長さを求め、その範囲だけを `compareMemory` で比べます。
`compareMemory` は同じファイルにある次の補助関数で、長さ 0 のときは `memcmp` を呼ばずに 0 を返します。

```cpp:line-numbers=74
  // memcmp にヌルポインタを渡す問題（未定義動作）を避けるため、
  // 専用の版を用意する
  static int compareMemory(const char *Lhs, const char *Rhs, size_t Length) {
    if (Length == 0)
      return 0;
    return ::memcmp(Lhs, Rhs, Length);
  }
```

違いが見つかれば、`Res < 0 ? -1 : 1` で -1 か 1 に整えて返します。

例: `"apple"` と `"apply"` は 5 文字ずつ比べ、5 文字目の `'e'` と `'y'` で違いが出ます。`'e'` の方が小さいので -1 です。

### 2. 共通部分が同じなら長さで決める

```cpp:line-numbers=184
    if (size() == RHS.size())
      return 0;
    return size() < RHS.size() ? -1 : 1;
```

`"app"` と `"apple"` は、短い方の 3 文字まで同じです。この場合は **短い方が小さい** と決めます。辞書でも「app」は「apple」より前に載っています。
長さも同じなら、完全に同じ文字列なので 0 です。

## ここがすごい

- **ヌル終端に頼らない**: `strcmp` は `\0` を見つけるまで進みますが、StringRef には `\0` がないかもしれません。長さを使うので、文字列の途中を指す StringRef でも安全に比べられます。途中に `\0` を含むデータも正しく扱えます。
- **速い比較は C ライブラリに任せる**: 1 文字ずつのループを自前で書かず、`memcmp` に任せています。`memcmp` は多くの環境で高度に最適化されています。
- **結果を -1/0/1 に整える**: `memcmp` の戻り値は「負か正か」しか保証されません。整えておくと、呼び出し側が `== -1` のように書いても期待通りに動きます。
- **空のポインタへの配慮**: `compareMemory` のコメントによると、ヌルポインタを `memcmp` に渡すと、長さ 0 でも未定義動作になります。空の StringRef はヌルポインタを持つことがあるので、長さ 0 を先に処理しています。

## まとめ

- 辞書順の比較は「共通部分を比べる → 同じなら短い方が小さい」の 2 段階。
- 長さを持つ文字列なら、ヌル終端なしで安全に比べられる。
- 標準関数の「符号だけ保証」の戻り値は、-1/0/1 に整えると扱いやすい。
- 長さ 0 でもヌルポインタを C 関数に渡すと未定義動作になる点に注意する。

