---
title: 「1,234,567」も「12,34,567」も書ける、桁区切りの状態機械
description: ロケールの区切り規則に従って数字に桁区切りを入れるクラス。3 桁ごとだけでなく、インド式のように区切り幅が変わる規則も小さな状態と next() 関数で扱う。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [2132, 2194]
function: digit_grouping
difficulty: 2
format: 2
tags: [文字列処理, 状態機械, 設計パターン]
---

## ひとことで

`fmt::format(std::locale("en_US.UTF-8"), "{:L}", 1234567)` は `"1,234,567"` になります。この **桁区切り** を入れるのが `digit_grouping` です。

区切りの規則は国によって違います。英語圏は 3 桁ごと、インドでは最初が 3 桁、そのあとは 2 桁ごと（`12,34,567`）です。このクラスはどちらも同じ仕組みで扱えます。

## コード

::: code-group

```cpp:line-numbers=2132 [日本語訳]
template <typename Char> class digit_grouping {
 private:
  std::string grouping_;
  std::basic_string<Char> thousands_sep_;

  struct next_state {
    std::string::const_iterator group;
    int pos;
  };
  auto initial_state() const -> next_state { return {grouping_.begin(), 0}; }

  // 次の桁区切りの位置を返す。
  auto next(next_state& state) const -> int {
    if (thousands_sep_.empty()) return max_value<int>();
    if (state.group == grouping_.end()) return state.pos += grouping_.back();
    if (*state.group <= 0 || *state.group == max_value<char>())
      return max_value<int>();
    state.pos += *state.group++;
    return state.pos;
  }

 public:
  explicit digit_grouping(locale_ref loc, bool localized = true) {
    if (!localized) return;
    auto sep = thousands_sep<Char>(loc);
    grouping_ = std::move(sep.grouping);
    if (sep.thousands_sep) thousands_sep_.assign(1, sep.thousands_sep);
  }
  digit_grouping(std::string grouping, std::basic_string<Char> sep)
      : grouping_(std::move(grouping)), thousands_sep_(std::move(sep)) {}

  auto has_separator() const -> bool { return !thousands_sep_.empty(); }

  auto count_separators(int num_digits) const -> int {
    int count = 0;
    auto state = initial_state();
    while (num_digits > next(state)) ++count;
    return count;
  }

  // digits に桁区切りを適用し、結果を out に書き出す。
  template <typename Out, typename C>
  auto apply(Out out, basic_string_view<C> digits) const -> Out {
    auto num_digits = static_cast<int>(digits.size());
    auto separators = basic_memory_buffer<int>();
    separators.push_back(0);
    auto state = initial_state();
    while (int i = next(state)) {
      if (i >= num_digits) break;
      separators.push_back(i);
    }
    for (int i = 0, sep_index = static_cast<int>(separators.size() - 1);
         i < num_digits; ++i) {
      if (num_digits - i == separators[sep_index]) {
        out = copy<Char>(thousands_sep_.data(),
                         thousands_sep_.data() + thousands_sep_.size(), out);
        --sep_index;
      }
      *out++ = static_cast<Char>(digits[to_unsigned(i)]);
    }
    return out;
  }
};
```

```cpp:line-numbers=2132 [原文]
template <typename Char> class digit_grouping {
 private:
  std::string grouping_;
  std::basic_string<Char> thousands_sep_;

  struct next_state {
    std::string::const_iterator group;
    int pos;
  };
  auto initial_state() const -> next_state { return {grouping_.begin(), 0}; }

  // Returns the next digit group separator position.
  auto next(next_state& state) const -> int {
    if (thousands_sep_.empty()) return max_value<int>();
    if (state.group == grouping_.end()) return state.pos += grouping_.back();
    if (*state.group <= 0 || *state.group == max_value<char>())
      return max_value<int>();
    state.pos += *state.group++;
    return state.pos;
  }

 public:
  explicit digit_grouping(locale_ref loc, bool localized = true) {
    if (!localized) return;
    auto sep = thousands_sep<Char>(loc);
    grouping_ = std::move(sep.grouping);
    if (sep.thousands_sep) thousands_sep_.assign(1, sep.thousands_sep);
  }
  digit_grouping(std::string grouping, std::basic_string<Char> sep)
      : grouping_(std::move(grouping)), thousands_sep_(std::move(sep)) {}

  auto has_separator() const -> bool { return !thousands_sep_.empty(); }

  auto count_separators(int num_digits) const -> int {
    int count = 0;
    auto state = initial_state();
    while (num_digits > next(state)) ++count;
    return count;
  }

  // Applies grouping to digits and writes the output to out.
  template <typename Out, typename C>
  auto apply(Out out, basic_string_view<C> digits) const -> Out {
    auto num_digits = static_cast<int>(digits.size());
    auto separators = basic_memory_buffer<int>();
    separators.push_back(0);
    auto state = initial_state();
    while (int i = next(state)) {
      if (i >= num_digits) break;
      separators.push_back(i);
    }
    for (int i = 0, sep_index = static_cast<int>(separators.size() - 1);
         i < num_digits; ++i) {
      if (num_digits - i == separators[sep_index]) {
        out = copy<Char>(thousands_sep_.data(),
                         thousands_sep_.data() + thousands_sep_.size(), out);
        --sep_index;
      }
      *out++ = static_cast<Char>(digits[to_unsigned(i)]);
    }
    return out;
  }
};
```

:::

## 前提知識

- **ロケールの grouping 文字列**: C++ のロケールは区切り幅を文字列で表します。各文字の **数値** が幅で、`"\3"` は「3 桁ごと」、`"\3\2"` は「最初 3 桁、以降 2 桁ごと」です。最後の幅が繰り返されます。
- **`std::string::const_iterator`**: 文字列の中の位置を指すものです。`*it` で文字を読み、`it++` で次へ進みます。
- **`struct next_state`**: いま grouping のどこを読んでいるか（`group`）と、右から数えた区切り位置（`pos`）を持つ小さな構造体です。
- **`while (int i = next(state))`**: 条件の中で変数を宣言する書き方です。`i` が 0 でない間ループします。
- **`basic_memory_buffer<int>`**: 小さいうちはヒープを使わない、{fmt} の可変長配列です。
- **`std::move`**: 文字列をコピーせずに中身を移します。

## 何をしているか

### 1. 次の区切り位置を返す `next`

```cpp:line-numbers=2144
  auto next(next_state& state) const -> int {
    if (thousands_sep_.empty()) return max_value<int>();
    if (state.group == grouping_.end()) return state.pos += grouping_.back();
    if (*state.group <= 0 || *state.group == max_value<char>())
      return max_value<int>();
    state.pos += *state.group++;
    return state.pos;
  }
```

区切り位置は「右から何桁目のあとに区切るか」で表します。grouping が `"\3\2"` なら、`next` を呼ぶたびに **3, 5, 7, 9, …** を返します。

- まだ grouping の文字があれば、その幅を `pos` に足して進む。
- 使い切ったら、最後の幅（2）を足し続ける。
- 幅が 0 以下か `CHAR_MAX` なら「これ以上区切らない」の意味なので、`int` の最大値を返す。
- 区切り文字がなければ、最初から最大値を返す。

### 2. 区切りの数を数える

```cpp:line-numbers=2165
  auto count_separators(int num_digits) const -> int {
    int count = 0;
    auto state = initial_state();
    while (num_digits > next(state)) ++count;
    return count;
  }
```

出力の長さを先に知るため、桁数より小さい区切り位置がいくつあるかを数えます。

### 3. 区切りを入れて書く `apply`

```cpp:line-numbers=2174
  auto apply(Out out, basic_string_view<C> digits) const -> Out {
    auto num_digits = static_cast<int>(digits.size());
    auto separators = basic_memory_buffer<int>();
    separators.push_back(0);
    auto state = initial_state();
    while (int i = next(state)) {
      if (i >= num_digits) break;
      separators.push_back(i);
    }
    for (int i = 0, sep_index = static_cast<int>(separators.size() - 1);
         i < num_digits; ++i) {
      if (num_digits - i == separators[sep_index]) {
        out = copy<Char>(thousands_sep_.data(),
                         thousands_sep_.data() + thousands_sep_.size(), out);
        --sep_index;
      }
      *out++ = static_cast<Char>(digits[to_unsigned(i)]);
    }
    return out;
  }
```

`1234567`（7 桁）、grouping `"\3"` で追います。

1. `separators` に `0` を入れ、`next` が返す 3, 6 を追加します。9 は 7 以上なのでやめます。→ `[0, 3, 6]`
2. 左から 1 桁ずつ書きます。「残りの桁数」が `separators` の末尾の値と等しくなったら、先に区切り文字を書きます。
   - `1` を書く前の残りは 7 → 書くだけ
   - `2` の前は残り 6 → `,` を書いてから `2`
   - `5` の前は残り 3 → `,` を書いてから `5`
3. 結果は `1,234,567` です。

先頭の `0` は番兵で、残りの桁数が 0 になることはないので、決して使われません。添字を範囲外にしないための安全装置です。

## ここがすごい

- **規則を `next` 1 つに閉じ込める**: 「3 桁ごと」も「3 桁のあと 2 桁ごと」も、区切り位置を順に返す `next` の違いだけです。数える処理（`count_separators`）と書く処理（`apply`）は規則を知らなくて済みます。
- **状態を小さな構造体に分離**: `next_state` を外から渡す設計なので、`digit_grouping` 自体は `const` のまま何度でも使えます。
- **右から決めた位置を左から書く**: 区切り位置は右から決まりますが、出力は左から書きたいものです。位置を先に配列に集め、逆順にたどることでうまく両立しています。
- **区切り文字が文字列**: `thousands_sep_` は 1 文字ではなく文字列なので、2 文字以上の区切り（全角スペースなど）にも対応できます。

## まとめ

- 「次の区切り位置」を返す関数を作ると、区切りの規則を 1 か所にまとめられる。
- 状態を別の構造体にすると、オブジェクト自体を変更せずに繰り返し使える。
- 右から決まる位置は、先に集めてから左から処理すると書きやすい。
- 配列の先頭に番兵を置くと、範囲チェックを省ける。
