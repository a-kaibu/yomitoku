---
title: "正規表現なしで「正しいバージョン名か」を検査する"
description: "case のパターンだけを使って、20.1.0 や v22.0.0-rc.1 は通し、20..1 や 1.2.3.4 は弾く。入れ子の case で段階的に形を確かめる関数。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [1401, 1437]
function: "nvm_is_valid_version"
difficulty: 3
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---
## ひとことで

`nvm_is_valid_version` は、文字列が nvm で扱える **正しい形のバージョン名か** を判定する関数です。

- 通る例: `node`、`stable`、`20`、`20.1`、`v20.1.0`、`iojs-v3.3.1`、`v22.0.0-rc.1`
- 弾く例: `abc`、`20..1`、`1.2.3.4`、`v20.tar`、`v22-rc`

正規表現を使わず、シェルの `case` のパターンだけで書かれています。

## コード

::: code-group

```sh:line-numbers=1401 [日本語訳]
nvm_is_valid_version() {
  case "${1-}" in
    "stable" | "unstable" | "iojs" | "node")
      return 0
    ;;
    *)
      local VERSION
      VERSION="${1-}"
      VERSION="${VERSION#iojs-}"
      local NVM_VERSION_CORE
      NVM_VERSION_CORE="${VERSION#v}"
      case "${NVM_VERSION_CORE}" in
        *-*)
          # プレリリース（rc、nightly、v8-canary など）は完全な x.y.z が必要で、ファイルの拡張子のような「ドットの後に数字以外」は決して含まない
          case "${NVM_VERSION_CORE#*-}" in
            '' | .* | *. | *..* | *.*[!0-9.]* | *[!0-9A-Za-z.-]*) return 1 ;;
          esac
          NVM_VERSION_CORE="${NVM_VERSION_CORE%%-*}"
          case "${NVM_VERSION_CORE}" in
            *.*.*) ;;
            *) return 1 ;;
          esac
          # プレリリースの `-` があると、下にあるシェルだけの検査には
          # たどり着かないので、ここで完全な検査をする。
          nvm_version_greater_than_or_equal_to "${VERSION}" 0 || return 1
        ;;
        *.)
          NVM_VERSION_CORE="${NVM_VERSION_CORE%.}"
        ;;
      esac
      case "${NVM_VERSION_CORE}" in
        '' | .* | *. | *..* | *.*.*.* | *[!0-9.]*) return 1 ;;
      esac
      # ここまで来たバージョンはすべて数なので `>= 0` が成り立つ
    ;;
  esac
}
```

```sh:line-numbers=1401 [原文]
nvm_is_valid_version() {
  case "${1-}" in
    "stable" | "unstable" | "iojs" | "node")
      return 0
    ;;
    *)
      local VERSION
      VERSION="${1-}"
      VERSION="${VERSION#iojs-}"
      local NVM_VERSION_CORE
      NVM_VERSION_CORE="${VERSION#v}"
      case "${NVM_VERSION_CORE}" in
        *-*)
          # prereleases (rc, nightly, v8-canary, ...) need a full x.y.z, and never have a dot followed by a non-digit, like a file extension
          case "${NVM_VERSION_CORE#*-}" in
            '' | .* | *. | *..* | *.*[!0-9.]* | *[!0-9A-Za-z.-]*) return 1 ;;
          esac
          NVM_VERSION_CORE="${NVM_VERSION_CORE%%-*}"
          case "${NVM_VERSION_CORE}" in
            *.*.*) ;;
            *) return 1 ;;
          esac
          # a prerelease's `-` makes it unreachable for the pure-shell checks
          # below, so do the full check now.
          nvm_version_greater_than_or_equal_to "${VERSION}" 0 || return 1
        ;;
        *.)
          NVM_VERSION_CORE="${NVM_VERSION_CORE%.}"
        ;;
      esac
      case "${NVM_VERSION_CORE}" in
        '' | .* | *. | *..* | *.*.*.* | *[!0-9.]*) return 1 ;;
      esac
      # every version that reaches this point is a number, and so `>= 0`
    ;;
  esac
}
```

:::

## 前提知識

- **`case` のパターン**: `*` は任意の文字列、`[!0-9.]` は数字とドット以外の 1 文字、`|` で複数のパターンを並べられます。上から順に照合し、一致した最初の分岐だけを実行します。
- **`;;`**: `case` の 1 つの分岐の終わりを表します。
- **関数の終了ステータス**: 最後に `return` が無い場合、最後に実行したコマンドの結果が関数の結果になります。`case` が何も実行しなかった場合は成功（0）です。
- **`${VERSION#iojs-}` / `${…#v}`**: 先頭の `iojs-` や `v` を取り除きます。
- **`${X#*-}`**: 最初の `-` までを削り、後ろ（プレリリース部分）を取り出します。
- **`${X%%-*}`**: 最初の `-` から後ろを削り、本体部分を取り出します。
- **`|| return 1`**: 左が失敗したら `return 1` します。

## 何をしているか

### 1. 特別な名前は無条件で OK

`stable`、`unstable`、`iojs`、`node` は正しい名前として成功を返します。

### 2. 前置きを取る

`iojs-` と `v` を取り除き、数字の部分 `NVM_VERSION_CORE` を取り出します。`v22.0.0-rc.1` なら `22.0.0-rc.1` です。

### 3. プレリリースの検査

`-` を含むならプレリリースです。まず `-` より後ろ（`rc.1`）を調べ、空・ドットで始まる/終わる・ドットの連続・「ドットの後に数字以外」（`.tar` のような拡張子）・英数字とドットとハイフン以外の文字、のどれかがあれば弾きます。

次に `-` より前（`22.0.0`）が `x.y.z` の 3 要素あるかを確かめます。最後に、`nvm_version_greater_than_or_equal_to` で詳しく検査します。

### 4. 末尾のドット

`20.` のような末尾のドットは取り除いて許します。

### 5. 本体の検査

空・ドットで始まる/終わる・ドットの連続・ドット 3 つ以上・数字とドット以外の文字、のどれかがあれば弾きます。ここを抜けたら、コメントのとおり「数字だけでできた正しい形」なので、成功で終わります。

## ここがすごい

- **「だめな形」を列挙して正しい形だけを残す**: `case` には「1 回以上の繰り返し」のような記法がないため、正しい形を直接書くのは困難です。代わりに、ありうる間違いをパターンで並べることで、正規表現と同等の検査をしています。
- **外部コマンドを起動しない**: `grep -E` を使えば 1 行で書けますが、そのたびにプロセスが起動します。この関数は大量に呼ばれるので、シェル組み込みの `case` だけで済ませる価値があります。
- **段階的に検査する**: 特別な名前 → 前置き除去 → プレリリース部分 → 本体、と順に絞り込むので、各段階のパターンが単純になっています。

## まとめ

- `case` で「間違った形」を並べると、正規表現なしで入力を検査できる。
- 複雑な形式は、部品に分けて順番に検査すると読みやすい。
- よく呼ばれる処理では、外部コマンドを避けるだけで大きく速くなる。
