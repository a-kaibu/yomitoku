---
title: "カーネルの名前から、OS の種類を決める"
description: "uname -s の結果を元に、Linux や BSD、Windows などの OS の種類を判定する関数。知らない OS の場合は、案内を出して終了する。"
language: shell
project: "neofetch"
repo: https://github.com/dylanaraps/neofetch
license: "MIT"
copyright: "Copyright (c) 2015-2021 Dylan Araps"
commit: "ccd5d9f52609bbdcd5d8fa78c4fdb0f12954125f"
file: "neofetch"
lines: [937, 967]
function: "get_os"
difficulty: 2
format: 2
tags: [設計パターン, 文字列処理, CLI]
---
## ひとことで

`get_os` は、**カーネルの名前から、動いている OS が何かを判定する** 関数です。判定の結果は `os` という変数に入ります。

neofetch は、OS ごとに表示する情報や取り方を変えます。そのため、まず OS の種類を正しく決めることが、すべての出発点になります。

## コード

::: code-group

```bash:line-numbers=937 [日本語訳]
get_os() {
    # $kernel_name は cache_uname という関数で設定され、uname -s の出力そのものです。
    # これは uname -s の出力です。
    case $kernel_name in
        Darwin)   os=$darwin_name ;;
        SunOS)    os=Solaris ;;
        Haiku)    os=Haiku ;;
        MINIX)    os=MINIX ;;
        AIX)      os=AIX ;;
        IRIX*)    os=IRIX ;;
        FreeMiNT) os=FreeMiNT ;;

        Linux|GNU*)
            os=Linux
        ;;

        *BSD|DragonFly|Bitrig)
            os=BSD
        ;;

        CYGWIN*|MSYS*|MINGW*)
            os=Windows
        ;;

        *)
            printf '%s\n' "Unknown OS detected: '$kernel_name', aborting..." >&2
            printf '%s\n' "Open an issue on GitHub to add support for your OS." >&2
            exit 1
        ;;
    esac
}
```

```bash:line-numbers=937 [原文]
get_os() {
    # $kernel_name is set in a function called cache_uname and is
    # just the output of "uname -s".
    case $kernel_name in
        Darwin)   os=$darwin_name ;;
        SunOS)    os=Solaris ;;
        Haiku)    os=Haiku ;;
        MINIX)    os=MINIX ;;
        AIX)      os=AIX ;;
        IRIX*)    os=IRIX ;;
        FreeMiNT) os=FreeMiNT ;;

        Linux|GNU*)
            os=Linux
        ;;

        *BSD|DragonFly|Bitrig)
            os=BSD
        ;;

        CYGWIN*|MSYS*|MINGW*)
            os=Windows
        ;;

        *)
            printf '%s\n' "Unknown OS detected: '$kernel_name', aborting..." >&2
            printf '%s\n' "Open an issue on GitHub to add support for your OS." >&2
            exit 1
        ;;
    esac
}
```

:::

## 前提知識

- **`uname -s`**: カーネルの名前を表示するコマンドです。Linux や Darwin などが返ります。この値は、別の関数で先に `kernel_name` に入れられています。
- **`case` 文**: 値のパターンに応じて処理を分けるシェルの書き方です。`*BSD` のように、ワイルドカードも使えます。
- **`printf`**: 書式を指定して文字列を表示します。ここでは、エラーの案内を標準エラーに出すために使われています。
- **`exit 1`**: 対応していない場合に、エラーの終了コードでスクリプトを止めます。

## 何をしているか

### 1. 特殊な名前を個別に判定する

```bash:line-numbers=940
    case $kernel_name in
        Darwin)   os=$darwin_name ;;
        SunOS)    os=Solaris ;;
        Haiku)    os=Haiku ;;
        MINIX)    os=MINIX ;;
        AIX)      os=AIX ;;
        IRIX*)    os=IRIX ;;
```

Darwin は `darwin_name` の値、SunOS は Solaris、Haiku や MINIX や AIX などは、そのままの名前として扱います。

### 2. Linux と BSD の仲間をまとめる

```bash:line-numbers=948

        Linux|GNU*)
            os=Linux
        ;;

        *BSD|DragonFly|Bitrig)
            os=BSD
        ;;
```

GNU で始まるものは Linux として扱います。末尾が BSD の名前、DragonFly、Bitrig は、まとめて BSD です。

### 3. Windows 系の環境を判定する

```bash:line-numbers=957
        CYGWIN*|MSYS*|MINGW*)
            os=Windows
        ;;
```

Cygwin、MSYS、MINGW で始まる名前は、Windows として扱います。

### 4. 知らない OS は止める

```bash:line-numbers=961
        *)
            printf '%s\n' "Unknown OS detected: '$kernel_name', aborting..." >&2
            printf '%s\n' "Open an issue on GitHub to add support for your OS." >&2
            exit 1
```

どれにも当たらないときは、未対応の OS であることを標準エラーに出し、終了します。案内として、GitHub で対応の要望を出すように伝えています。

## ここがすごい

- **名前の揺れをまとめる**: `GNU/Linux` や `*BSD` のように、同じ仲間の名前を 1 つの分類にまとめています。
- **分類が明確**: 判定の順番が上から見える形になっているので、新しい OS を追加する場所も分かりやすいです。
- **未知を黙って通さない**: 知らない OS で誤った表示をしないように、その場で止めて理由を伝えます。

## まとめ

- 複数の環境に対応するときは、名前の揺れを分類にまとめる。
- 未対応の場合は、理由を伝えて止めると利用者が次に動ける。
- 判定の順番を読みやすく保つと、後から追加しやすい。
