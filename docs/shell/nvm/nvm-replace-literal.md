---
title: "正規表現を使わない「文字どおりの置換」を awk で書く"
description: "文字列の中の部分文字列を、正規表現として解釈せずにそのまま置き換える関数。値を ENVIRON 経由で awk に渡し、index と substr のループで置換する。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [4319, 4330]
function: "nvm_replace_literal"
difficulty: 2
tags: [文字列処理, 防御的プログラミング]
---
## ひとことで

`nvm_replace_literal 文字列 探す文字列 置き換える文字列` は、文字列の中の部分を **文字どおりに** 置き換える関数です。

```
nvm_replace_literal "/home/me.dev/.nvm/x" "/home/me.dev" '${HOME}'
→ ${HOME}/.nvm/x
```

`sed 's/A/B/'` で置換すると、A は正規表現として、B は特別な記号（`&` や `\`）を含む文字列として解釈されます。パスのように `.` や `/` を含む値ではそれが事故のもとです。この関数は正規表現を一切使いません。

## コード

```sh:line-numbers=4319
nvm_replace_literal() {
  nvm_echo "${1-}" | NVM_FROM="${2-}" NVM_TO="${3-}" command awk '
  BEGIN { from = ENVIRON["NVM_FROM"]; to = ENVIRON["NVM_TO"]; n = length(from) }
  {
    out = ""; s = $0
    while (n > 0 && (i = index(s, from)) > 0) {
      out = out substr(s, 1, i - 1) to
      s = substr(s, i + n)
    }
    print out s
  }'
}
```

## 前提知識

- **`A=値 コマンド`**: コマンドの前に `変数=値` を書くと、そのコマンドにだけ環境変数を渡せます。
- **`ENVIRON["名前"]`**: awk から環境変数を読む方法です。
- **`index(s, t)`**: 文字列 `s` の中で `t` が最初に出てくる位置（1 から数える）です。無ければ 0 です。正規表現ではなく、文字どおりに探します。
- **`substr(s, 開始, 長さ)`**: 部分文字列を取り出します。長さを省略すると最後までです。
- **`length(s)`**: 文字数です。
- **awk の文字列の連結**: `out substr(...) to` のように、値を並べて書くだけでつながります。

## 何をしているか

### 1. 値を環境変数で渡す（4320〜4321 行目）

探す文字列と置き換える文字列を `NVM_FROM`、`NVM_TO` という環境変数で awk に渡し、`BEGIN` で読み込みます。探す文字列の長さ `n` も計算しておきます。

### 2. 見つかるたびに置き換える（4323〜4328 行目）

`s` に今の行を入れ、`index` で探す文字列の位置 `i` を探します。見つかったら、

- `s` の先頭から `i` の手前までと、置き換える文字列を `out` に足す
- `s` を、見つかった部分の直後から最後までに縮める

を繰り返します。見つからなくなったら、残りの `s` を `out` の後ろに付けて出力します。

`/home/me.dev/.nvm/x` から `/home/me.dev` を探すと、`i=1` で見つかり、`out='${HOME}'`、`s='/.nvm/x'` になります。もう見つからないので `${HOME}/.nvm/x` が出力されます。

`n > 0` の条件は、探す文字列が空のときに無限ループになるのを防いでいます。

## ここがすごい

- **`-v` ではなく `ENVIRON` を使う**: awk に値を渡す `-v name=値` は、値の中の `\n` や `\\` をエスケープとして解釈してしまいます。環境変数経由なら、値はそのまま届きます。Windows のパス（`C:\Users\...`）でも壊れません。
- **正規表現の特殊文字を気にしなくてよい**: `sed` で同じことをするには、探す値の `.` `*` `[` `/` などと、置換後の `&` `\` を全部エスケープする必要があります。`index` と `substr` だけなら、その心配がまったくありません。
- **重なりも安全**: 置き換えた後の文字列は `out` に移すので、置き換えた結果がもう一度置き換えられることはありません。

この関数は、表示用にパスを `${HOME}` などに置き換える `nvm_sanitize_path` で使われています。

## まとめ

- 値をそのまま置換したいときは、正規表現を使わない方法を選ぶ。
- awk に任意の文字列を渡すなら、`-v` より `ENVIRON` のほうが安全。
- `index` と `substr` のループで、どの言語でも文字どおりの置換を書ける。
