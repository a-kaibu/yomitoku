---
title: "%XX を \\xXX に置き換えて printf に任せる URL デコード"
description: "URL エンコードされた文字列を元に戻す関数。+ を空白に、% を \\x に置き換えてから printf に渡すだけで、16 進数のバイトを文字に戻す。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [255, 285]
function: "omz_urldecode"
difficulty: 2
tags: [文字列処理, Unicode, ハック]
---
## ひとことで

`omz_urldecode` は、URL エンコードされた文字列を **元の文字に戻す** 関数です。

```
omz_urldecode "%E3%81%93%E3%82%93+world"
→ こん world
```

ループで 1 文字ずつ解析するのではなく、**文字列置換を 3 回して `printf` に渡すだけ** でデコードしているのが見どころです。

## コード

```zsh:line-numbers=255
function omz_urldecode {
  emulate -L zsh
  local encoded_url=$1

  # Work bytewise, since URLs escape UTF-8 octets
  local caller_encoding=$langinfo[CODESET]
  local LC_ALL=C
  export LC_ALL

  # Change + back to ' '
  local tmp=${encoded_url:gs/+/ /}
  # Protect other escapes to pass through the printf unchanged
  tmp=${tmp:gs/\\/\\\\/}
  # Handle %-escapes by turning them into `\xXX` printf escapes
  tmp=${tmp:gs/%/\\x/}
  local decoded="$(printf -- "$tmp")"

  # Now we have a UTF-8 encoded string in the variable. We need to re-encode
  # it if caller is in a non-UTF-8 locale.
  local -a safe_encodings
  safe_encodings=(UTF-8 utf8 US-ASCII)
  if [[ -z ${safe_encodings[(r)$caller_encoding]} ]]; then
    decoded=$(echo -E "$decoded" | iconv -f UTF-8 -t $caller_encoding)
    if [[ $? != 0 ]]; then
      echo "Error converting string from UTF-8 to $caller_encoding" >&2
      return 1
    fi
  fi

  echo -E "$decoded"
}
```

## 前提知識

- **URL エンコード**: 文字のバイト値を `%XX`（16 進数 2 桁）で表す方法です。空白は `+` で表すことがあります。
- **`printf` のエスケープ `\xXX`**: `printf` の書式の中に `\xE3` と書くと、16 進数 `E3` のバイトが出力されます。
- **`${変数:gs/A/B/}`**: zsh の修飾子で、変数の中の A をすべて B に置き換えます（`g` は全部、`s` は置換）。
- **`\\`**: 文字としての `\` を表すための書き方です。
- **`printf -- "$tmp"`**: `$tmp` を書式として解釈して出力します。`--` は「ここからはオプションではない」という印で、`$tmp` が `-` で始まっても大丈夫にしています。
- **`LC_ALL=C`**: 1 バイトずつ処理するためのロケール設定です。
- **`iconv -f UTF-8 -t 文字コード`**: 文字コードを変換するコマンドです。

## 何をしているか

`a+%E3%81%93\n` を例に追います（最後の `\n` は文字としてのバックスラッシュと n）。

### 1. `+` を空白に（265 行目）

`a %E3%81%93\n`

### 2. `\` を `\\` に（267 行目）

`a %E3%81%93\\n`

元からあった `\` は、`printf` に `\n`（改行）などと解釈されないよう二重にしておきます。これで `printf` は `\\` を「文字の `\`」として出力します。

### 3. `%` を `\x` に（269 行目）

`a \xE3\x81\x93\\n`

### 4. printf に渡す（270 行目）

`printf` が `\xE3\x81\x93` を 3 バイトに変換し、それが UTF-8 の「こ」になります。結果は `a こ\n` です。

### 5. 必要なら文字コードを変換（274〜282 行目）

呼び出し元のロケールが UTF-8 でなければ、`iconv` で変換します。

## ここがすごい

- **既存の機能に変換を任せる**: `%XX` を 16 進数として解析し、バイトに変換する、という処理を自分で書かずに、`printf` の `\x` エスケープに丸投げしています。文字列置換だけでデコーダーが完成します。
- **置換の順番が大事**: `\` を二重にする処理を、`%` を `\x` にするより **前に** やっているのがポイントです。逆にすると、自分で作った `\x` まで二重にしてしまいます。こうした「エスケープの順番」はどの言語でもよくある落とし穴です。
- **バイト単位で扱う**: `LC_ALL=C` にしておくことで、`printf` が作ったバイト列をそのまま変数に入れられます。

コメント（244〜248 行目）にあるとおり、この関数は入力が正しい URL エンコードかどうかは検査しません。人に見せるために読みやすくする、という用途に割り切っています。

## まとめ

- `%XX` を `\xXX` に置き換えると、`printf` で URL デコードができる。
- 文字列を別の言語（ここでは `printf` の書式）に渡すときは、元からある特殊文字を先にエスケープする。
- エスケープ処理は順番を間違えると壊れる。
