---
title: 左寄せ・右寄せ・中央寄せを「シフト量の表」1 つで切り替える
description: 書式指定の幅に合わせて左右に埋め文字を入れる関数。配置の種類ごとに「余白を何ビット右シフトするか」を文字列リテラルに並べ、分岐なしで左側の余白を決める。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1935, 1957]
function: detail::write_padded
difficulty: 2
format: 2
tags: [ハック, 文字列処理, 最適化]
---

## ひとことで

`fmt::format("{:>6}", 42)` は `"    42"`、`{:<6}` は `"42    "`、`{:^6}` は `"  42  "` になります。`write_padded` は、このように **指定の幅に足りないぶんを、配置に応じて左右に振り分けて埋める** 関数です。

中身を書く処理は関数 `f` として受け取り、余白の計算と埋め文字の出力だけを担当します。

## コード

::: code-group

```cpp:line-numbers=1935 [日本語訳]
// f の出力を、specs の書式指定に従って埋め文字付きで書き出す。
// size: 出力のサイズ（コード単位）。
// width: 出力の表示幅（端末の桁数）。
template <typename Char, align default_align = align::left, typename OutputIt,
          typename F>
FMT_CONSTEXPR auto write_padded(OutputIt out, const format_specs& specs,
                                size_t size, size_t width, F&& f) -> OutputIt {
  static_assert(default_align == align::left || default_align == align::right,
                "");
  unsigned spec_width = to_unsigned(specs.width);
  size_t padding = spec_width > width ? spec_width - width : 0;
  // constexpr 関数の中では static constexpr が使えないので、
  // シフト量は文字列リテラルとして表す。
  auto* shifts =
      default_align == align::left ? "\x1f\x1f\x00\x01" : "\x00\x1f\x00\x01";
  size_t left_padding = padding >> shifts[static_cast<int>(specs.align())];
  size_t right_padding = padding - left_padding;
  auto it = reserve(out, size + padding * specs.fill_size());
  if (left_padding != 0) it = fill<Char>(it, left_padding, specs);
  it = f(it);
  if (right_padding != 0) it = fill<Char>(it, right_padding, specs);
  return base_iterator(out, it);
}
```

```cpp:line-numbers=1935 [原文]
// Writes the output of f, padded according to format specifications in specs.
// size: output size in code units.
// width: output display width in (terminal) column positions.
template <typename Char, align default_align = align::left, typename OutputIt,
          typename F>
FMT_CONSTEXPR auto write_padded(OutputIt out, const format_specs& specs,
                                size_t size, size_t width, F&& f) -> OutputIt {
  static_assert(default_align == align::left || default_align == align::right,
                "");
  unsigned spec_width = to_unsigned(specs.width);
  size_t padding = spec_width > width ? spec_width - width : 0;
  // Shifts are encoded as string literals because static constexpr is not
  // supported in constexpr functions.
  auto* shifts =
      default_align == align::left ? "\x1f\x1f\x00\x01" : "\x00\x1f\x00\x01";
  size_t left_padding = padding >> shifts[static_cast<int>(specs.align())];
  size_t right_padding = padding - left_padding;
  auto it = reserve(out, size + padding * specs.fill_size());
  if (left_padding != 0) it = fill<Char>(it, left_padding, specs);
  it = f(it);
  if (right_padding != 0) it = fill<Char>(it, right_padding, specs);
  return base_iterator(out, it);
}
```

:::

## 前提知識

- **テンプレート引数 `align default_align = align::left`**: 型ではなく値（列挙型の値）をテンプレート引数にしています。文字列は左寄せ、数値は右寄せが既定なので、それを呼び出し側で選びます。
- **`enum class align`**: `none`(0)・`left`(1)・`right`(2)・`center`(3)・`numeric`(4) の 5 つの値を持つ列挙型です。`static_cast<int>` で番号に変換できます。
- **`F&& f`**: 関数やラムダ式を受け取る引数です。`f(it)` で呼ぶと、中身を書いて進んだ位置を返します。
- **`"\x1f\x1f\x00\x01"`**: 16 進でバイトを並べた文字列リテラルです。`0x1f` は 31。文字列リテラルの末尾には自動で `\0`（0）が付きます。
- **`static_assert`**: コンパイル時に条件を確かめます。
- **`reserve` と `base_iterator`**: 出力先にあらかじめ領域を確保し、書き終えたら元の種類の出力先に戻すための {fmt} の補助関数です。

## 何をしているか

### 1. 余白の合計を求める

```cpp:line-numbers=1944
  unsigned spec_width = to_unsigned(specs.width);
  size_t padding = spec_width > width ? spec_width - width : 0;
```

幅の指定が 6、中身の表示幅が 2 なら、`padding = 4` です。中身のほうが長ければ 0 です。

### 2. シフト量の表で左側の余白を決める

```cpp:line-numbers=1948
  auto* shifts =
      default_align == align::left ? "\x1f\x1f\x00\x01" : "\x00\x1f\x00\x01";
  size_t left_padding = padding >> shifts[static_cast<int>(specs.align())];
```

`default_align` が左寄せのとき、表は `{31, 31, 0, 1}` と、末尾の自動の `0` です。配置の番号で引き、`padding` をその量だけ右シフトします。

| 配置 | 番号 | シフト量 | 左の余白（padding = 4） |
| --- | --- | --- | --- |
| none（既定） | 0 | 31 | 4 >> 31 = 0 |
| left | 1 | 31 | 0 |
| right | 2 | 0 | 4 >> 0 = 4 |
| center | 3 | 1 | 4 >> 1 = 2 |
| numeric | 4 | 0（末尾の `\0`） | 4 |

右シフト 31 は「ほぼ 0 にする」、0 は「そのまま」、1 は「半分」です。幅は int に収まる値なので、31 ビット右シフトすれば必ず 0 になります。

既定が右寄せのときは、表の先頭だけが `0` になっていて、`none` が右寄せとして扱われます。

### 3. 右側は残り、そして出力

```cpp:line-numbers=1951
  size_t right_padding = padding - left_padding;
  auto it = reserve(out, size + padding * specs.fill_size());
  if (left_padding != 0) it = fill<Char>(it, left_padding, specs);
  it = f(it);
  if (right_padding != 0) it = fill<Char>(it, right_padding, specs);
  return base_iterator(out, it);
```

右の余白は `padding - left_padding` です。中央寄せで `padding = 5` なら左 2、右 3 になります。左の埋め文字 → 中身（`f(it)`）→ 右の埋め文字の順に書きます。

## ここがすごい

- **分岐を表引きに置き換える**: `switch` で配置ごとに書く代わりに、シフト量の表 1 つで 0・全部・半分を表しています。
- **末尾のヌル文字まで使う**: 文字列リテラルの終端の `\0` が、5 番目の要素（`numeric`）として働いています。`numeric` は数値の右寄せの一種なので、シフト 0 が正しい値です。
- **文字列リテラルにした理由**: 表の直前のコメントのとおり、`constexpr` 関数の中では（古い規格では）`static constexpr` 配列が使えません。文字列リテラルならコンパイル時にも使えます。
- **中身と余白の分離**: 中身の書き方は `f` に任せているので、整数・文字列・浮動小数点数のどれにも同じ余白処理が使えます。また `size`（バイト数）と `width`（表示幅）を別に受け取るので、全角文字が混じっても見た目の幅で正しくそろいます。

## まとめ

- 「0・全部・半分」はシフト量 31・0・1 で表せる。
- 場合分けを小さな表にすると、分岐のないコードになる。
- 文字列リテラルの末尾の `\0` も表の要素として使える。
- 中身を書く処理を関数で受け取ると、余白の処理を共通化できる。
