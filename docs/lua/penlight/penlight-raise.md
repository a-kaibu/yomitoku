---
title: エラーの扱いを設定で切り替える、raise
description: Lua のユーティリティ集 Penlight の utils.raise。エラーを、戻り値として返すか、Lua のエラーとして投げるか、プログラムを終了するかを、全体の設定で切り替えます。
language: lua
project: Penlight
repo: https://github.com/lunarmodules/Penlight
license: MIT
copyright: Copyright (C) 2009-2016 Steve Donovan, David Manura.
commit: "7f3351f226c2f643aaa1d3afa8d7293dd8a1d985"
file: lua/pl/utils.lua
lines: [512, 520]
format: 2
function: utils.raise
difficulty: 2
tags: [エラー処理, 防御的プログラミング, 設計パターン]
---
## ひとことで

`utils.raise(err)` は、エラーの扱い方を、全体の設定 `err_mode` によって切り替える関数です。既定の設定では、`nil` とエラーの文字列を返します。`error` の設定では、Lua のエラーとして投げます。`quit` の設定では、プログラムを終了します。同じ呼び出しで、利用者の好みに合わせた失敗の伝え方ができます。

## コード

```lua:line-numbers=512
function utils.raise (err)
    if err_mode == 'default' then
        return nil, err
    elseif err_mode == 'quit' then
        return utils.quit(err)
    else
        error(err, 2)
    end
end
```

## 前提知識

- **戻り値による失敗の伝え方**: `nil` と理由の文字列を返す方法です。Lua で、ファイルを開くときなどによく使われる約束です。
- **`error(err, 2)`**: Lua のエラーを起こす関数です。第 2 引数の `2` は、エラーの位置を、呼び出した側の行にするための指定です。
- **`err_mode`**: エラーの扱い方を表す、Penlight 全体の設定です。`utils` の別の箇所で、値を変えられます。
- **`utils.quit`**: プログラムを、指定した状態で終了させる Penlight の関数です。

## 何をしているか

### 1. 既定の設定では、戻り値として返す

`err_mode` が `default` のとき、`nil` とエラーの文字列を返します。呼ぶ側は、戻り値を確かめて、自分で判断できます。

```lua:line-numbers=513
    if err_mode == 'default' then
        return nil, err
```

### 2. quit の設定では、終了させる

`err_mode` が `quit` のときは、`utils.quit` を呼んで、プログラムを終わらせます。失敗を無視できない場面のための設定です。

```lua:line-numbers=515
    elseif err_mode == 'quit' then
        return utils.quit(err)
```

### 3. それ以外は、Lua のエラーとして投げる

残りの場合、つまり `error` の設定では、`error(err, 2)` で、Lua のエラーとして投げます。呼び出し元の場所が、エラーの位置になります。

```lua:line-numbers=517
    else
        error(err, 2)
    end
```

## ここがすごい

- **同じ呼び出しで、扱いを変えられる**: 関数の中のコードを書き換えずに、設定を変えるだけで、失敗の伝え方が切り替わります。
- **失敗を値として扱える**: 既定の設定では、エラーで止まらずに、戻り値で判断できます。途中の処理を続けやすいです。
- **位置を分かりやすく**: `error` の第 2 引数で、エラーの場所を呼び出し側にそろえます。利用者が原因を探しやすくなります。
- **注意点**: 既定の設定では、エラーを無視しやすくなります。戻り値の確認を忘れると、失敗に気づかずに進んでしまいます。

## まとめ

- 失敗の扱いを設定で切り替えると、呼び出し側の好みに合わせられる。
- 戻り値で返す方法は、途中で止めずに判断できるが、確認を忘れないことが大切である。
- エラーの位置を、呼び出し側に合わせると、原因を追いやすくなる。
