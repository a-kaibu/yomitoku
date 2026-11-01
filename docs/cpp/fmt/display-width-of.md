---
title: 全角文字かどうかを範囲表の二分探索で判定する
description: Unicode のコードポイントが端末で何マス分の幅になるかを返す関数。全角の範囲をまとめた表を二分探索し、よく使う ASCII などは最初の 1 回の比較で返す。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [837, 851]
function: detail::display_width_of
difficulty: 1
format: 2
tags: [Unicode, 探索, アルゴリズム]
---

## ひとことで

`display_width_of(cp)` は、文字 `cp` を端末に表示したときの幅を返します。普通の文字は **1**、漢字やひらがな、多くの絵文字のような全角文字は **2** です。

`fmt::format("{:>10}", "あいう")` のように幅をそろえるとき、文字数ではなく見た目の幅で数えるために使われます。

## コード

```cpp:line-numbers=837
FMT_CONSTEXPR inline auto display_width_of(uint32_t cp) noexcept -> size_t {
  if (cp < 0x1100) return 1;
  size_t lo = 0;
  size_t hi = sizeof(wide_cp_data<>::ranges) / sizeof(wide_cp_range);
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (cp < wide_cp_data<>::ranges[mid].first)
      hi = mid;
    else if (cp > wide_cp_data<>::ranges[mid].last)
      lo = mid + 1;
    else
      return 2;
  }
  return 1;
}
```

## 前提知識

- **コードポイント**: Unicode で文字に割り当てられた番号です。`A` は `0x41`、`あ` は `0x3042` です。`uint32_t` で表します。
- **`wide_cp_data<>::ranges`**: 同じファイルで関数の少し上に定義されている、全角文字の範囲 `{first, last}` を小さい順に並べた配列です。Unicode 16.0.0 の East_Asian_Width が W（Wide）か F（Fullwidth）の文字を、重なりをまとめて並べてあります。
- **`sizeof(配列) / sizeof(要素)`**: 配列の要素数を求める昔ながらの書き方です。
- **`noexcept`**: 例外を投げない約束です。
- **`FMT_CONSTEXPR`**: `constexpr` に展開されるマクロで、コンパイル時にも実行できます。

## 何をしているか

### 1. 小さい番号はすぐ返す

```cpp:line-numbers=838
  if (cp < 0x1100) return 1;
```

表の最初の範囲はハングル字母の `0x1100` から始まります。それより小さい文字（ASCII、ラテン文字、ギリシャ文字など）は全角になりえないので、比較 1 回で **1** を返します。英語のテキストでは、ほぼすべての文字がここで終わります。

### 2. 範囲の表を二分探索する

```cpp:line-numbers=839
  size_t lo = 0;
  size_t hi = sizeof(wide_cp_data<>::ranges) / sizeof(wide_cp_range);
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (cp < wide_cp_data<>::ranges[mid].first)
      hi = mid;
    else if (cp > wide_cp_data<>::ranges[mid].last)
      lo = mid + 1;
    else
      return 2;
  }
```

`lo` と `hi` は「まだ調べていない範囲」の両端です。真ん中の範囲 `mid` と比べて、

- `cp` が範囲の始まりより小さい → 左半分に絞る（`hi = mid`）
- `cp` が範囲の終わりより大きい → 右半分に絞る（`lo = mid + 1`）
- どちらでもない → 範囲の中にある → **2** を返す

`あ`（`0x3042`）なら、何回か半分に絞るうちに `{0x3041, 0x3096}` に行き当たって 2 を返します。表には約 100 個の範囲があるので、比較は 7 回ほどで済みます。

### 3. 見つからなければ 1

```cpp:line-numbers=850
  return 1;
```

どの範囲にも入らなければ半角として **1** を返します。

## ここがすごい

- **範囲で持つから表が小さい**: 全角の文字は数万個ありますが、連続した範囲にまとめると約 100 個です。1 文字ずつの表に比べて、ずっと小さく済みます。
- **二分探索**: 並んだ範囲を前から順に見ると最悪 100 回の比較ですが、二分探索なら 7 回ほどです。
- **よくある場合を先に片づける**: `cp < 0x1100` の早期リターンで、英数字には探索のコストすらかかりません。
- **`lo + (hi - lo) / 2`**: `(lo + hi) / 2` と書くと、値が大きいとき足し算があふれる可能性があります。差を半分にして足すのは二分探索の定番の安全な書き方です。
- **表を構造体テンプレートに入れる理由**: 表を包んでいる `template <typename = void> struct wide_cp_data` は、ヘッダに置いた `static` な配列が複数のファイルから使われても 1 つにまとまるようにする古典的な技です。

## まとめ

- 文字の性質の表は、連続する範囲にまとめると小さくできる。
- 並んだ範囲の検索は二分探索で、比較回数を対数に減らせる。
- 一番よく来る入力を最初に早期リターンすると、平均の速さが上がる。
- 中央の位置は `lo + (hi - lo) / 2` と書くと桁あふれしない。
