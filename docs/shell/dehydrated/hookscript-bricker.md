---
title: "フックのスクリプトが、未知の呼び出しを無視するかを試す"
description: "存在しないフック名で、利用者のフックスクリプトを一度呼び、未知の呼び出しを正しく無視するかを確かめる関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [359, 365]
function: "hookscript_bricker_hook"
difficulty: 2
format: 2
tags: [設計パターン, CLI, イディオム]
---
## ひとことで

`hookscript_bricker_hook` は、**利用者のフックスクリプトが、知らない呼び出しを正しく無視するかを確かめる** 関数です。わざと存在しない名前で呼び、壊れていれば止めます。

フックは、証明書の処理の節目で呼ばれるスクリプトです。将来、新しい節目が増えたときに、古いフックが誤動作すると困ります。そこで、無視できるかを事前に試します。

## コード

::: code-group

```bash:line-numbers=359 [日本語訳]
hookscript_bricker_hook() {
  # フックスクリプトは、知らないフックを無視するべきです。
  # 知らない呼び出しを送って、フックスクリプトの作者に、この動作を明確に示します。
  if [[ -n "${HOOK}" ]]; then
    "${HOOK}" "this_hookscript_is_broken__dehydrated_is_working_fine__please_ignore_unknown_hooks_in_your_script" || _exiterr "Please check your hook script, it should exit cleanly without doing anything on unknown/new hooks."
  fi
}
```

```bash:line-numbers=359 [原文]
hookscript_bricker_hook() {
  # Hook scripts should ignore any hooks they don't know.
  # Calling a random hook to make this clear to the hook script authors...
  if [[ -n "${HOOK}" ]]; then
    "${HOOK}" "this_hookscript_is_broken__dehydrated_is_working_fine__please_ignore_unknown_hooks_in_your_script" || _exiterr "Please check your hook script, it should exit cleanly without doing anything on unknown/new hooks."
  fi
}
```

:::

## 前提知識

- **フック**: 特定の出来事の時に、利用者が用意した処理を呼ぶ仕組みです。
- **`HOOK`**: フックスクリプトの場所を表す変数です。設定されていなければ、何もしません。
- **未知の呼び出し**: スクリプトが知らない名前で呼ばれることです。正しいスクリプトは、何もせずに終わるべきです。
- **`_exiterr`**: エラーを表示して終わる、同じファイル内の関数です。

## 何をしているか

### 1. フックの設定があるか調べる

```bash:line-numbers=361
  # 知らない呼び出しを送って、フックスクリプトの作者に、この動作を明確に示します。
```

`HOOK` が空でなければ、フックスクリプトが設定されています。

### 2. 存在しない名前で呼ぶ

```bash:line-numbers=362
  if [[ -n "${HOOK}" ]]; then
```

`this_hookscript_is_broken__dehydrated_is_working_fine__please_ignore_unknown_hooks_in_your_script` という名前で、フックを呼びます。この名前は、どのスクリプトにも無い前提です。

### 3. 正常に終わらなければエラーにする

```bash:line-numbers=362
  if [[ -n "${HOOK}" ]]; then
```

フックが失敗したら、利用者に、未知の呼び出しを無視するように直すよう伝えて止めます。

## ここがすごい

- **問題を本番の前に見つける**: 実際の処理で誤動作する前に、無視できるかを確かめられます。
- **原因の説明が丁寧**: エラーのメッセージで、何を直せばよいかを具体的に伝えています。
- **設定が無ければ何もしない**: フックを使わない利用者には、何も影響しません。

## まとめ

- 拡張の仕組みは、知らない入力を受けても壊れないことを、事前に確かめる。
- エラーのメッセージには、利用者が次に取るべき行動を書く。
- 使わない機能は、設定が無ければ影響を出さない。
