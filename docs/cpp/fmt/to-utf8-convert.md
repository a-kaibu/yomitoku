---
title: サロゲートペアを 1 回の引き算で合体させる UTF-16→UTF-8 変換
description: UTF-16 や UTF-32 の文字列を UTF-8 に変換する関数。サロゲートペアをマジックナンバー 1 つで結合し、不正な入力には「失敗・置換・WTF-8」の 3 つの方針を選べる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1598, 1636]
function: to_utf8::convert
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, エラー処理]
---

## ひとことで

`to_utf8<WChar>::convert` は、Windows の `wchar_t` 文字列（UTF-16）や UTF-32 の文字列を、UTF-8 に変換してバッファに追加する関数です。

`L"あ😀"` なら、`あ` は 3 バイト、`😀` は 4 バイトの UTF-8 になります。UTF-16 特有の **サロゲートペア**（2 つの 16 ビット値で 1 文字を表す仕組み）の扱いと、壊れた入力への対応がよくできています。

## コード

::: code-group

```cpp:line-numbers=1598 [日本語訳]
  static auto convert(Buffer& buf, basic_string_view<WChar> s,
                      to_utf8_error_policy policy = to_utf8_error_policy::abort)
      -> bool {
    for (auto p = s.begin(); p != s.end(); ++p) {
      uint32_t c = static_cast<uint32_t>(*p);
      if (sizeof(WChar) == 2 && c >= 0xd800 && c <= 0xdfff) {
        // サロゲートペアを処理する。
        ++p;
        if (p == s.end() || (c & 0xfc00) != 0xd800 || (*p & 0xfc00) != 0xdc00) {
          switch (policy) {
          case to_utf8_error_policy::abort: return false;
          case to_utf8_error_policy::replace:
            buf.append(string_view("\xEF\xBF\xBD"));
            break;
          case to_utf8_error_policy::wtf: to_utf8_3bytes(buf, c); break;
          }
          --p;
          continue;
        }
        c = (c << 10) + static_cast<uint32_t>(*p) - 0x35fdc00;
      }
      if (c < 0x80) {
        buf.push_back(static_cast<char>(c));
      } else if (c < 0x800) {
        buf.push_back(static_cast<char>(0xc0 | (c >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else if ((c >= 0x800 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xffff)) {
        to_utf8_3bytes(buf, c);
      } else if (c >= 0x10000 && c <= 0x10ffff) {
        buf.push_back(static_cast<char>(0xf0 | (c >> 18)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0x3ffff) >> 12)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0xfff) >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else {
        return false;
      }
    }
    return true;
  }
```

```cpp:line-numbers=1598 [原文]
  static auto convert(Buffer& buf, basic_string_view<WChar> s,
                      to_utf8_error_policy policy = to_utf8_error_policy::abort)
      -> bool {
    for (auto p = s.begin(); p != s.end(); ++p) {
      uint32_t c = static_cast<uint32_t>(*p);
      if (sizeof(WChar) == 2 && c >= 0xd800 && c <= 0xdfff) {
        // Handle a surrogate pair.
        ++p;
        if (p == s.end() || (c & 0xfc00) != 0xd800 || (*p & 0xfc00) != 0xdc00) {
          switch (policy) {
          case to_utf8_error_policy::abort: return false;
          case to_utf8_error_policy::replace:
            buf.append(string_view("\xEF\xBF\xBD"));
            break;
          case to_utf8_error_policy::wtf: to_utf8_3bytes(buf, c); break;
          }
          --p;
          continue;
        }
        c = (c << 10) + static_cast<uint32_t>(*p) - 0x35fdc00;
      }
      if (c < 0x80) {
        buf.push_back(static_cast<char>(c));
      } else if (c < 0x800) {
        buf.push_back(static_cast<char>(0xc0 | (c >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else if ((c >= 0x800 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xffff)) {
        to_utf8_3bytes(buf, c);
      } else if (c >= 0x10000 && c <= 0x10ffff) {
        buf.push_back(static_cast<char>(0xf0 | (c >> 18)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0x3ffff) >> 12)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0xfff) >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else {
        return false;
      }
    }
    return true;
  }
```

:::

## 前提知識

- **UTF-16 とサロゲートペア**: UTF-16 は 1 文字を 16 ビットで表しますが、`0xFFFF` を超える文字（絵文字など）は、前半（`0xD800〜0xDBFF`）と後半（`0xDC00〜0xDFFF`）の 2 つの値に分けて表します。
- **UTF-8**: 文字の番号の大きさに応じて 1〜4 バイトを使います。2 バイト目以降はすべて `10xxxxxx` という形です。
- **`static` メンバ関数**: オブジェクトなしで呼べる関数です。結果を書き込む `Buffer& buf` を引数で受け取ります。
- **`sizeof(WChar) == 2`**: 文字型が 16 ビットかどうか（UTF-16 か）を調べています。テンプレートの型が決まると定数になります。
- **`enum class` と `switch`**: `to_utf8_error_policy` は `abort` / `replace` / `wtf` の 3 つの値を持つ列挙型で、`switch` で場合分けしています。
- **イテレータ `p`**: 文字列の中の位置を指すものです。`++p` で次へ、`*p` でその文字を読みます。

## 何をしているか

### 1. サロゲートを見つけたら次と組にする

```cpp:line-numbers=1603
      if (sizeof(WChar) == 2 && c >= 0xd800 && c <= 0xdfff) {
        // サロゲートペアを処理する。
        ++p;
        if (p == s.end() || (c & 0xfc00) != 0xd800 || (*p & 0xfc00) != 0xdc00) {
          switch (policy) {
          case to_utf8_error_policy::abort: return false;
          case to_utf8_error_policy::replace:
            buf.append(string_view("\xEF\xBF\xBD"));
            break;
          case to_utf8_error_policy::wtf: to_utf8_3bytes(buf, c); break;
          }
          --p;
          continue;
        }
        c = (c << 10) + static_cast<uint32_t>(*p) - 0x35fdc00;
      }
```

`c` がサロゲートの範囲なら、次の値も読みます。前半＋後半の正しい組でなければ、方針に従います。

- `abort`: `false` を返して変換失敗。
- `replace`: 置換文字 U+FFFD（UTF-8 で `EF BF BD`）を出力。
- `wtf`: そのサロゲートを 3 バイトの UTF-8 として出力（WTF-8 と呼ばれる、壊れた UTF-16 も往復できる形式）。

その後 `--p` で 1 つ戻り、読みすぎた次の値をもう一度普通に処理します。

### 2. マジックナンバーで合体

```cpp:line-numbers=1617
        c = (c << 10) + static_cast<uint32_t>(*p) - 0x35fdc00;
```

正しい組なら `c = (c << 10) + 後半 - 0x35fdc00` で 1 つの番号にします。

教科書どおりの式は `0x10000 + ((前半 - 0xD800) << 10) + (後半 - 0xDC00)` です。これを展開すると、定数部分が `0x10000 - (0xD800 << 10) - 0xDC00 = -0x35fdc00` にまとまります。

`😀` は UTF-16 で `D83D DE00` です。`(0xD83D << 10) = 0x360F400`、これに `0xDE00` を足して `0x361D200`、`0x35fdc00` を引くと `0x1F600` になり、正しく U+1F600 が得られます。

### 3. 番号の大きさで UTF-8 のバイト数を決める

```cpp:line-numbers=1619
      if (c < 0x80) {
        buf.push_back(static_cast<char>(c));
      } else if (c < 0x800) {
        buf.push_back(static_cast<char>(0xc0 | (c >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else if ((c >= 0x800 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xffff)) {
        to_utf8_3bytes(buf, c);
      } else if (c >= 0x10000 && c <= 0x10ffff) {
        buf.push_back(static_cast<char>(0xf0 | (c >> 18)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0x3ffff) >> 12)));
        buf.push_back(static_cast<char>(0x80 | ((c & 0xfff) >> 6)));
        buf.push_back(static_cast<char>(0x80 | (c & 0x3f)));
      } else {
        return false;
      }
```

- `0x80` 未満: 1 バイトそのまま。
- `0x800` 未満: `110xxxxx 10xxxxxx` の 2 バイト。
- `0xFFFF` 以下（サロゲートの範囲を除く）: 3 バイト。`あ`（`0x3042`）は `E3 81 82`。
- `0x10FFFF` 以下: 4 バイト。`0x1F600` は `F0 9F 98 80`。
- それ以外（UTF-32 で与えられたサロゲート単体の値や、0x10FFFF を超える値）: 変換失敗。

## ここがすごい

- **定数を 1 つにまとめる**: 引き算 2 回と足し算 1 回を、シフトと足し算と「定数 1 つの引き算」に減らしています。式を展開して定数部分を先に計算しておく、という典型的な最適化です。
- **エラー方針を選べる**: 壊れた UTF-16 は Windows のファイル名などで実際に現れます。例外にする、記号に置き換える、情報を失わずに保存する（WTF-8）、を使う側が選べます。
- **1 つのコードで UTF-16 と UTF-32**: `sizeof(WChar) == 2` の条件は型が決まれば定数なので、UTF-32 版ではサロゲートの処理がまるごと消えます。
- **`(c & 0xfc00) != 0xd800`**: 上位 6 ビットを見るだけで「前半サロゲートかどうか」を判定しています。範囲の比較 2 回より短く書けます。

## まとめ

- サロゲートペアは「前半を 10 ビットずらして後半を足し、定数を引く」で 1 つの番号になる。
- 式を展開して定数をまとめると、実行時の計算が減る。
- 壊れた入力に対する方針（失敗・置換・保存）を選べるようにすると、用途の幅が広がる。
- 型の大きさで分岐すると、テンプレートの型ごとに不要なコードが消える。
