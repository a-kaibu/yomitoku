---
title: "1 バイトずつ見て %XX に変換する URL エンコード"
description: "文字列を URL で使える形に変換する関数。ロケールを C にして 1 バイトずつ処理し、zsh の算術 [##16] #byte で文字コードを 16 進数にする。"
language: shell
project: "Oh My Zsh"
repo: https://github.com/ohmyzsh/ohmyzsh
license: "MIT"
copyright: "Copyright (c) 2009-2026 Robby Russell and contributors (https://github.com/ohmyzsh/ohmyzsh/contributors)"
commit: "17a2b4c3a5855524ad4772a17ada0dc474e2fdf3"
file: "lib/functions.zsh"
lines: [176, 239]
function: "omz_urlencode"
difficulty: 3
format: 2
tags: [文字列処理, Unicode, ネットワーク]
---
## ひとことで

`omz_urlencode` は、文字列を **URL の中で安全に使える形** に変換する関数です。

```
omz_urlencode "こんにちは world"
→ %E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF+world
```

URL には使える文字が決まっているので、日本語や空白などは `%E3` のように「`%` + 16 進数 2 桁」で表す必要があります。この関数は zsh の機能だけでそれを行います。

## コード

::: code-group

```zsh:line-numbers=176 [日本語訳]
function omz_urlencode() {
  emulate -L zsh
  setopt norematchpcre

  local -a opts
  # 空白を含む値などが勝手に展開されないよう、引数をクォートする（global alias の P など）
  zparseopts -D -E -a opts 'r' 'm' 'P'

  local in_str="$@"
  local url_str=""
  local spaces_as_plus
  if [[ -z $opts[(r)-P] ]]; then spaces_as_plus=1; fi
  local str="$in_str"

  # URL は UTF-8 で書く決まりなので、必要ならロケールの文字コードを UTF-8 に変換する
  local encoding=$langinfo[CODESET]
  local safe_encodings
  safe_encodings=(UTF-8 utf8 US-ASCII)
  if [[ -z ${safe_encodings[(r)$encoding]} ]]; then
    str=$(echo -E "$str" | iconv -f $encoding -t UTF-8)
    if [[ $? != 0 ]]; then
      echo "Error converting string from $encoding to UTF-8" >&2
      return 1
    fi
  fi

  # LC_CTYPE=C にして、1 バイトずつ処理する
  # Termux には UTF-8 のロケールしか無いので、この方法は使えない
  # その場合は UTF-8 の文字として処理されるが、URL には問題ない
  local i byte ord LC_ALL=C
  export LC_ALL
  local reserved=';/?:@&=+$,'
  local mark='_.!~*''()-'
  local dont_escape="[A-Za-z0-9"
  if [[ -z $opts[(r)-r] ]]; then
    dont_escape+=$reserved
  fi
  # `-` を含む $mark は範囲指定と誤解されないよう、最後に付ける
  if [[ -z $opts[(r)-m] ]]; then
    dont_escape+=$mark
  fi
  dont_escape+="]"

  # ループの中でサブシェルを作らず、1 回の printf で済むよう実装している
  # 特に Windows で速くするため
  local url_str=""
  for (( i = 1; i <= ${#str}; ++i )); do
    byte="$str[i]"
    if [[ "$byte" =~ "$dont_escape" ]]; then
      url_str+="$byte"
    else
      if [[ "$byte" == " " && -n $spaces_as_plus ]]; then
        url_str+="+"
      elif [[ "$PREFIX" = *com.termux* ]]; then
        # Termux は非 UTF-8 のロケールを持たないので、UTF-8 の文字をそのまま送る
        url_str+="$byte"
      else
        ord=$(( [##16] #文字のバイト値を 16 進数にする（$(( [##16] #byte ))）
        url_str+="%$ord"
      fi
    fi
  done
  echo -E "$url_str"
}
```

```zsh:line-numbers=176 [原文]
function omz_urlencode() {
  emulate -L zsh
  setopt norematchpcre

  local -a opts
  # Quote the specs so global aliases (e.g. common-aliases' P) don't expand here
  zparseopts -D -E -a opts 'r' 'm' 'P'

  local in_str="$@"
  local url_str=""
  local spaces_as_plus
  if [[ -z $opts[(r)-P] ]]; then spaces_as_plus=1; fi
  local str="$in_str"

  # URLs must use UTF-8 encoding; convert str to UTF-8 if required
  local encoding=$langinfo[CODESET]
  local safe_encodings
  safe_encodings=(UTF-8 utf8 US-ASCII)
  if [[ -z ${safe_encodings[(r)$encoding]} ]]; then
    str=$(echo -E "$str" | iconv -f $encoding -t UTF-8)
    if [[ $? != 0 ]]; then
      echo "Error converting string from $encoding to UTF-8" >&2
      return 1
    fi
  fi

  # Use LC_CTYPE=C to process text byte-by-byte
  # Note that this doesn't work in Termux, as it only has UTF-8 locale.
  # Characters will be processed as UTF-8, which is fine for URLs.
  local i byte ord LC_ALL=C
  export LC_ALL
  local reserved=';/?:@&=+$,'
  local mark='_.!~*''()-'
  local dont_escape="[A-Za-z0-9"
  if [[ -z $opts[(r)-r] ]]; then
    dont_escape+=$reserved
  fi
  # $mark must be last because of the "-"
  if [[ -z $opts[(r)-m] ]]; then
    dont_escape+=$mark
  fi
  dont_escape+="]"

  # Implemented to use a single printf call and avoid subshells in the loop,
  # for performance (primarily on Windows).
  local url_str=""
  for (( i = 1; i <= ${#str}; ++i )); do
    byte="$str[i]"
    if [[ "$byte" =~ "$dont_escape" ]]; then
      url_str+="$byte"
    else
      if [[ "$byte" == " " && -n $spaces_as_plus ]]; then
        url_str+="+"
      elif [[ "$PREFIX" = *com.termux* ]]; then
        # Termux does not have non-UTF8 locales, so just send the UTF-8 character directly
        url_str+="$byte"
      else
        ord=$(( [##16] #byte ))
        url_str+="%$ord"
      fi
    fi
  done
  echo -E "$url_str"
}
```

:::

## 前提知識

- **URL エンコード**: URL に使えない文字を、その文字のバイト値を 16 進数にして `%XX` で表す方法です。日本語の「こ」は UTF-8 で 3 バイト（`E3 81 93`）なので `%E3%81%93` になります。空白は `+` か `%20` です。
- **`emulate -L zsh`**: この関数の中だけ、zsh の標準の設定で動かします。ユーザーの設定に左右されないためです。
- **`zparseopts -D -E -a opts 'r' 'm' 'P'`**: `-r` `-m` `-P` というオプションを解析して配列 `opts` に入れ、引数から取り除きます。
- **`$opts[(r)-P]`**: 配列 `opts` から `-P` に一致する要素を探します。無ければ空です。
- **`$langinfo[CODESET]`**: 今のロケールの文字コード（`UTF-8` など）です。
- **`LC_ALL=C`**: ロケールを C にすると、文字列が **1 バイトずつ** 扱われます。
- **`$str[i]`**: 文字列の i 番目の文字（ここではバイト）です。
- **`$(( [##16] #byte ))`**: zsh の算術式です。`#byte` は変数 `byte` の最初の文字の文字コード、`[##16]` は結果を 16 進数で、しかも `16#` という前置きなしで出す指定です。

## 何をしているか

### 1. オプションの解析

`-P` が無ければ、空白を `+` にする設定にします。

### 2. UTF-8 に変換

URL は UTF-8 で表すのが決まりです。今のロケールが UTF-8 か ASCII でなければ、`iconv` で UTF-8 に変換します。

### 3. エスケープしない文字を決める

`LC_ALL=C` にして、1 バイトずつ処理できるようにします。エスケープしない文字の集まりを `[A-Za-z0-9…]` の形で作ります。`-r` が無ければ予約文字（`;/?:@&=+$,`）を、`-m` が無ければ記号（`_.!~*'()-`）を足します。コメントのとおり、`-` を含む `$mark` は範囲指定と誤解されないよう最後に足します。

### 4. 1 バイトずつ変換

各バイトについて、

- エスケープしない文字ならそのまま
- 空白で `+` にする設定なら `+`
- それ以外は `$(( [##16] #byte ))` で 16 進数にして `%` を付ける

を行います。「こ」の 1 バイト目 `0xE3` は `%E3` になります。

## ここがすごい

- **外部コマンドを起動しないループ**: コメントにあるとおり、1 文字ごとに `printf` や `od` を呼ぶとプロセスの起動が何百回も起きて遅くなります（特に Windows で）。zsh の算術式で文字コードを得ることで、ループの中を全部シェルの中で済ませています。
- **バイト単位で処理するためにロケールを切り替える**: UTF-8 のロケールのままだと「こ」は 1 文字として扱われます。`LC_ALL=C` にすれば 3 バイトに分かれ、それぞれをエスケープできます。`local` で設定しているので、関数を出れば元に戻ります。
- **呼び出し側が選べる**: URL 全体を渡すときは区切り記号を残し、値だけを渡すときは `-r` で全部エスケープする、と用途に応じて選べます。

## まとめ

- URL エンコードは、UTF-8 のバイト列を 1 バイトずつ `%XX` にする処理。
- `LC_ALL=C` にすると、文字列をバイト単位で扱える。
- zsh の `$(( [##16] #c ))` で、文字の文字コードを 16 進数で得られる。
