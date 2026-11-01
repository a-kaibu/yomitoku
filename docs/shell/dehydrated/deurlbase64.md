---
title: "消された = を補ってから、URL 形式の base64 を元に戻す"
description: "URL 安全な base64 を、末尾の詰め物を補い、記号を元に戻してから復号する関数。長さが 4 の倍数になるよう、余りに応じて = を付ける。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [929, 936]
function: "deurlbase64"
difficulty: 3
format: 2
tags: [暗号, 文字列処理, 数値計算]
---
## ひとことで

`deurlbase64` は、`urlbase64` で作った文字列を **元のバイナリデータに戻す** 関数です。末尾の `=` が消されているので、まず長さを 4 の倍数にそろえるための `=` を補い、`-` と `_` を元の `+` と `/` に戻してから、openssl で復号します。

base64 は、4 文字を単位にして表すので、文字数が 4 の倍数であることが前提です。URL 形式では末尾の `=` が省かれているため、この関数がそれを補う役割を担います。

## コード

```bash:line-numbers=929
deurlbase64() {
  data="$(cat | tr -d ' \n\r')"
  modlen=$((${#data} % 4))
  padding=""
  if [[ "${modlen}" = "2" ]]; then padding="==";
  elif [[ "${modlen}" = "3" ]]; then padding="="; fi
  printf "%s%s" "${data}" "${padding}" | tr -d '\n\r' | _sed -e 'y:-_:+/:' | "${OPENSSL}" base64 -d -A
}
```

## 前提知識

- **base64 の詰め物 `=`**: 元のデータの長さが 3 の倍数でないとき、末尾を埋めるための記号です。
- **`${#data}`**: 変数の文字数を表します。
- **`% 4`**: 4 で割った余りです。余りが 2 なら `==` が、3 なら `=` が必要です。
- **`printf "%s%s"`**: 2 つの文字列を、改行なしでつなげて出力します。
- **`base64 -d -A`**: base64 を復号します。`-A` は、入力が 1 行にまとめられていることを表します。

## 何をしているか

### 1. 入力から空白と改行を消す

```bash:line-numbers=930
  data="$(cat | tr -d ' \n\r')"
```

標準入力のデータを読み、空白、改行、キャリッジリターンを取り除きます。

### 2. 余りを調べて詰め物を決める

```bash:line-numbers=931
  modlen=$((${#data} % 4))
  padding=""
  if [[ "${modlen}" = "2" ]]; then padding="==";
  elif [[ "${modlen}" = "3" ]]; then padding="="; fi
```

文字数を 4 で割った余りを求めます。余りが 2 なら `==`、余りが 3 なら `=` を詰め物とします。余りが 0 なら、詰め物は要りません。

### 3. 記号を戻して復号する

```bash:line-numbers=935
  printf "%s%s" "${data}" "${padding}" | tr -d '\n\r' | _sed -e 'y:-_:+/:' | "${OPENSSL}" base64 -d -A
```

データに詰め物を付け、改行を消し、`y:-_:+/:` で `-` と `_` を元の `+` と `/` に戻します。最後に openssl の base64 復号に渡します。

## ここがすごい

- **余りの計算だけで必要な詰め物が決まる**: 4 の倍数という base64 の決まりを、剰余の計算だけで扱っています。
- **変換の順番が正しい**: 詰め物を付けてから記号を戻すと、base64 として正しい形になります。
- **パイプで流れるように書く**: 入力、補正、変換、復号を、1 本のパイプで表しています。途中で止まる判断をしないので、シンプルです。

## まとめ

- base64 の詰め物は、文字数の余りから決まる。
- 形式を変換するときは、決まりに合う順番で処理する。
- 余りを使う計算は、倍数の性質を利用する定番の書き方。
