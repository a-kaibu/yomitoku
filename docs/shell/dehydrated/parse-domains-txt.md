---
title: "domains.txt の中身を、正規化して 1 行ずつ出す"
description: "設定のファイルと、その補助のフォルダにある .txt を一括で読み、大文字を小文字にし、空白と コメント行を整える関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1835, 1846]
function: "parse_domains_txt"
difficulty: 2
format: 2
tags: [文字列処理, CLI, イディオム]
---
## ひとことで

`parse_domains_txt` は、**ドメインの設定ファイルを読んで、比べやすい 1 行ずつの形に整える** 関数です。読み込むのは、設定のファイルと、その隣の `.d` フォルダにある `.txt` ファイルです。

設定は、人が手で書くため、空白や大文字、コメントが混じります。そのままでは扱いにくいので、この関数で形を揃えます。

## コード

::: code-group

```bash:line-numbers=1835 [日本語訳]
parse_domains_txt() {
  # ワイルドカードを一時的に有効にします。
  noglob_set
  local inputs=("${DOMAINS_TXT}" "${DOMAINS_TXT}.d"/*.txt)
  noglob_clear

  cat "${inputs[@]}" |
    tr -d '\r' |
    awk '{print tolower($0)}' |
    _sed -e 's/^[[:space:]]*//g' -e 's/[[:space:]]*$//g' -e 's/[[:space:]]+/ /g' -e 's/([^ ])>/\1 >/g' -e 's/> />/g' |
    (grep -vE '^(#|$)' || true)
}
```

```bash:line-numbers=1835 [原文]
parse_domains_txt() {
  # Allow globbing temporarily
  noglob_set
  local inputs=("${DOMAINS_TXT}" "${DOMAINS_TXT}.d"/*.txt)
  noglob_clear

  cat "${inputs[@]}" |
    tr -d '\r' |
    awk '{print tolower($0)}' |
    _sed -e 's/^[[:space:]]*//g' -e 's/[[:space:]]*$//g' -e 's/[[:space:]]+/ /g' -e 's/([^ ])>/\1 >/g' -e 's/> />/g' |
    (grep -vE '^(#|$)' || true)
}
```

:::

## 前提知識

- **`noglob_set` と `noglob_clear`**: ワイルドカードの展開を一時的に止めたり、戻したりする関数です。ここでは、`.d/*.txt` を展開させるために、一時的に解除しています。
- **配列の作り方**: `("A" "B"...)` の形で、複数の値を 1 つの配列に入れます。
- **`tr -d '\r'`**: Windows の改行の復帰文字を取り除きます。
- **`grep -vE`**: 一致しない行だけを残すコマンドです。コメントや空行を除くのに使います。

## 何をしているか

### 1. 読み込むファイルを集める

```bash:line-numbers=1837
  noglob_set
  local inputs=("${DOMAINS_TXT}" "${DOMAINS_TXT}.d"/*.txt)
  noglob_clear
```

ワイルドカードを一時的に有効にして、設定ファイルと `.d` の中の `.txt` を一覧にします。その後、元の設定に戻します。

### 2. 改行の復帰と大文字を整える

```bash:line-numbers=1841
  cat "${inputs[@]}" |
    tr -d '\r' |
    awk '{print tolower($0)}' |
```

すべてのファイルを連結し、復帰の文字を消して、小文字に変換します。

### 3. 空白を詰める

```bash:line-numbers=1844
    _sed -e 's/^[[:space:]]*//g' -e 's/[[:space:]]*$//g' -e 's/[[:space:]]+/ /g' -e 's/([^ ])>/\1 >/g' -e 's/> />/g' |
```

行の前後の空白を消し、途中の連続した空白を 1 つにまとめます。`>` の前後の空白も、そろえます。

### 4. コメントと空行を除く

```bash:line-numbers=1845
    (grep -vE '^(#|$)' || true)
```

`#` で始まる行と、空の行を取り除きます。`|| true` を付けて、全部が除かれても失敗にしないようにしています。

## ここがすごい

- **一括で読む**: 設定の本体と補助のファイルを、同じ仕組みで扱えます。
- **比較しやすい形にする**: 大文字と空白の揺れを消すので、同じ名前が同じ文字列になります。
- **空でも壊れない**: 最後の `|| true` によって、有効な行が無くても、呼び出し側は失敗を受け取りません。

## まとめ

- 人が書く設定は、読んだ直後に形を揃えると後の処理が楽になる。
- 一時的な設定変更は、使い終わったら必ず元に戻す。
- 空の結果を許す処理では、失敗の終了コードを抑えておく。
