---
title: "OS に合わせてカーネルの表示を決める"
description: "OS の種類と設定に応じて、カーネルの名前やバージョンを表示用の文字列にする関数。特定の OS では取得を省き、情報が重複するときは隠す。"
language: shell
project: "neofetch"
repo: https://github.com/dylanaraps/neofetch
license: "MIT"
copyright: "Copyright (c) 2015-2021 Dylan Araps"
commit: "ccd5d9f52609bbdcd5d8fa78c4fdb0f12954125f"
file: "neofetch"
lines: [1394, 1422]
function: "get_kernel"
difficulty: 3
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`get_kernel` は、**OS の種類と利用者の設定に合わせて、カーネルの情報をどう表示するかを決める** 関数です。同じ「カーネル」でも、OS によって取り方が違うので、分岐で対応しています。

neofetch は多くの OS で動きます。すべてを同じ方法で取ろうとすると失敗するので、OS ごとの例外を、この関数の中にまとめています。

## コード

::: code-group

```bash:line-numbers=1394 [日本語訳]
get_kernel() {
    # AIX と IRIX は統合されたシステムなので、この関数を省くのが望ましいです。
    [[ $os =~ (AIX|IRIX) ]] && return

    # Haiku は uname -r ではなく、uname -v を使います。
    [[ $os == Haiku ]] && {
        kernel=$(uname -v)
        return
    }

    # Windows の uname は GNU 環境の情報を返すことがあるため、wmic を使います。
    [[ $os == Windows ]] && {
        kernel=$(wmic os get Version)
        kernel=${kernel/Version}
        return
    }

    case $kernel_shorthand in
        on)  kernel=$kernel_version ;;
        off) kernel="$kernel_name $kernel_version" ;;
    esac

    # 情報がディストリビューションと同じなら、カーネルの表示を隠します。
    [[ $os =~ (BSD|MINIX) && $distro == *"$kernel_name"* ]] &&
        case $distro_shorthand in
            on|tiny) kernel=$kernel_version ;;
            *)       unset kernel ;;
        esac
}
```

```bash:line-numbers=1394 [原文]
get_kernel() {
    # Since these OS are integrated systems, it's better to skip this function altogether
    [[ $os =~ (AIX|IRIX) ]] && return

    # Haiku uses 'uname -v' and not - 'uname -r'.
    [[ $os == Haiku ]] && {
        kernel=$(uname -v)
        return
    }

    # In Windows 'uname' may return the info of GNUenv thus use wmic for OS kernel.
    [[ $os == Windows ]] && {
        kernel=$(wmic os get Version)
        kernel=${kernel/Version}
        return
    }

    case $kernel_shorthand in
        on)  kernel=$kernel_version ;;
        off) kernel="$kernel_name $kernel_version" ;;
    esac

    # Hide kernel info if it's identical to the distro info.
    [[ $os =~ (BSD|MINIX) && $distro == *"$kernel_name"* ]] &&
        case $distro_shorthand in
            on|tiny) kernel=$kernel_version ;;
            *)       unset kernel ;;
        esac
}
```

:::

## 前提知識

- **`uname -r` と `uname -v`**: カーネルのリリース番号と、バージョンの文字列を表示するコマンドです。OS によって、どちらを使うかが違います。
- **`wmic`**: Windows で、システムの情報を問い合わせるコマンドです。
- **`kernel_shorthand`**: 表示の形を、短い形か詳しい形かで切り替える設定です。
- **`[[ ... =~ ... ]]`**: 文字列が正規表現に一致するかを調べる、bash の書き方です。

## 何をしているか

### 1. 取得しない OS を除く

```bash:line-numbers=1396
    [[ $os =~ (AIX|IRIX) ]] && return

    # Haiku は uname -r ではなく、uname -v を使います。
```

AIX と IRIX では、カーネルの情報を取る意味が薄いので、何もせずに戻ります。

### 2. Haiku と Windows は専用の方法を使う

```bash:line-numbers=1400
        kernel=$(uname -v)
        return
    }

    # Windows の uname は GNU 環境の情報を返すことがあるため、wmic を使います。
    [[ $os == Windows ]] && {
        kernel=$(wmic os get Version)
        kernel=${kernel/Version}
        return
    }

    case $kernel_shorthand in
```

Haiku は `uname -v`、Windows は `wmic` で、それぞれ表示用の値を取ります。どちらも通常の方法とは違うため、先に処理して戻ります。

### 3. 表示の形を設定で決める

```bash:line-numbers=1413
        off) kernel="$kernel_name $kernel_version" ;;
    esac

    # 情報がディストリビューションと同じなら、カーネルの表示を隠します。
    [[ $os =~ (BSD|MINIX) && $distro == *"$kernel_name"* ]] &&
```

`kernel_shorthand` が `on` なら、バージョンだけを表示します。`off` なら、名前とバージョンを並べます。

### 4. 同じ情報なら隠す

```bash:line-numbers=1420
            *)       unset kernel ;;
        esac
}
```

BSD や MINIX で、ディストリビューションの名前にカーネルの名前が含まれるときは、重複を避けます。短い設定ならバージョンだけを残し、それ以外はカーネルの表示を消します。

## ここがすごい

- **例外を 1 か所にまとめる**: OS 固有の事情を、この関数の中の分岐として閉じ込めています。ほかの関数は、結果を使うだけです。
- **早めに戻る**: 特殊な OS は、先に処理して戻るので、後続の判断が単純になります。
- **重複を見せない**: 同じ情報を二度出さないように、条件を組んでいます。表示が簡潔に保たれます。

## まとめ

- 複数の環境に対応するときは、例外を分岐として 1 か所に集める。
- 特殊な場合は、先に処理して戻ると読みやすい。
- 表示が重複しないように、条件で隠す仕組みを入れる。
