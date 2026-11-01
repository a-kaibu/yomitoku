---
title: "ミラー URL を二段構えで検査してから使う"
description: "Node.js のダウンロード元 URL を返す関数。まず case で危険な記号を弾き、次に awk の正規表現で許可した文字だけかを確かめる。ブラケット式の書き方のコツもコメントにある。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [3465, 3498]
function: "nvm_get_mirror"
difficulty: 2
tags: [セキュリティ, 正規表現, 防御的プログラミング]
---
## ひとことで

`nvm_get_mirror node std` は、Node.js をダウンロードする元の URL を返します。既定は `https://nodejs.org/dist` ですが、環境変数 `NVM_NODEJS_ORG_MIRROR` で社内ミラーなどに変えられます。

ユーザーが設定する値なので、そのまま使うと危険です。この関数は値を **2 段階で検査** し、URL として正しい文字だけでできているときにだけ返します。

## コード

```sh:line-numbers=3465
nvm_get_mirror() {
  local NVM_MIRROR
  NVM_MIRROR=''
  case "${1}-${2}" in
    node-std) NVM_MIRROR="${NVM_NODEJS_ORG_MIRROR:-https://nodejs.org/dist}" ;;
    iojs-std) NVM_MIRROR="${NVM_IOJS_ORG_MIRROR:-https://iojs.org/dist}" ;;
    *)
      nvm_err 'unknown type of node.js or io.js release'
      return 1
    ;;
  esac

  case "${NVM_MIRROR}" in
    *\`* | *\\* | *\'* | *\(* | *' '* )
      nvm_err '$NVM_NODEJS_ORG_MIRROR and $NVM_IOJS_ORG_MIRROR may only contain a URL'
      return 2
    ;;
  esac


  # Allow RFC 3986 `unreserved` (A-Za-z0-9-._~) plus the authority and path
  # punctuation a mirror URL legitimately needs: `:` for a port, `@` for
  # userinfo, `[`/`]` for an IPv6 literal host, `%` for percent-encoding.
  # `sub-delims` (!$&'()*+,;=) and the query/fragment delimiters (?#) stay out:
  # nvm appends a path to this value, so a query string could never work anyway,
  # and several of those characters are shell metacharacters.
  # Note: in a bracket expression `]` must come first and `-` last to be literal.
  if ! nvm_echo "${NVM_MIRROR}" | command awk '{ if ($0 !~ /^https?:\/\/[]a-zA-Z0-9._~:\/@%[-]+$/) exit 1 }'; then
      nvm_err '$NVM_NODEJS_ORG_MIRROR and $NVM_IOJS_ORG_MIRROR may only contain a URL'
      return 2
  fi

  nvm_echo "${NVM_MIRROR}"
}
```

## 前提知識

- **ミラー**: 同じファイルを置いている別のサーバーです。
- **`case "${1}-${2}" in node-std)`**: 2 つの引数をハイフンでつないで 1 つの値にし、組み合わせで分岐しています。
- **`case` のパターン `*\`*`**: `\` でエスケープした記号を含むか、という意味です。`` ` ``、`\`、`'`、`(`、空白のどれかを含めば一致します。
- **awk の正規表現 `^https?:\/\/[...]+$`**: `http://` か `https://` で始まり、`[...]` の中の文字だけが最後まで続く、という意味です。`s?` は「`s` が 0 個か 1 個」です。
- **ブラケット式 `[...]`**: 中のどれか 1 文字に一致します。`]` は先頭に、`-` は末尾に置くと、ただの文字として扱われます。
- **`exit 1`**: awk を終了ステータス 1 で終わらせます。シェル側の `if !` で受け取ります。

## 何をしているか

### 1. 種類ごとに値を決める（3468〜3475 行目）

`node-std` なら `NVM_NODEJS_ORG_MIRROR`、`iojs-std` なら `NVM_IOJS_ORG_MIRROR` を使い、未設定なら公式の URL にします。それ以外の組み合わせはエラーです。

### 2. 第 1 段階: 危険な記号を弾く（3477〜3482 行目）

バッククォート、バックスラッシュ、シングルクォート、丸かっこ、空白は、シェルでコマンドの実行や区切りに使われる記号です。これらを含む値はすぐに弾きます。

### 3. 第 2 段階: 許可した文字だけか（3492〜3495 行目）

awk で、値全体が `http(s)://` + 許可した文字だけでできているかを調べます。許可する文字は、3485〜3490 行目のコメントにあるとおりです。

- URL で安全な英数字と `-._~`
- ポートの `:`、ユーザー情報の `@`、IPv6 アドレスの `[` `]`、パーセントエンコードの `%`、パスの `/`

`?` や `#`、`&` などは許可しません。nvm はこの値の後ろにパスを足して使うので、クエリ文字列があっても意味がなく、しかもそれらはシェルで特別な意味を持つからです。

`https://nodejs.org/dist` は通り、`https://example.com/$(rm -rf ~)` は第 1 段階で、`https://example.com/a;b` は第 2 段階で弾かれます。

## ここがすごい

- **許可リスト方式**: 危険な文字を全部挙げるのは難しいですが、URL に必要な文字は限られています。必要なものだけを許可すれば、想定外の攻撃も防げます。
- **なぜその文字を許すのかを書いている**: コメントで、各記号が必要な理由と、許さない記号の理由を説明しています。後から「この記号も通して」という要望が来ても判断しやすくなります。
- **ブラケット式の落とし穴を明記**: `[]a-z…-]` のように `]` を先頭、`-` を末尾に置かないと意図どおりに動かないことを、3491 行目に書き残しています。
- **二段構え**: 第 1 段階は外部コマンドを使わない速いチェック、第 2 段階は正確なチェックです。

## まとめ

- ユーザーが設定する URL も、使う前に検査する。
- 必要な文字だけを許す許可リストは、禁止リストより安全。
- ブラケット式では `]` を先頭、`-` を末尾に置くと文字そのものになる。
