---
title: レベルごとの関数を閉包で作る、log のループ
description: Lua の小さなログライブラリ rxi/log.lua の各レベルの関数。ループの中で、レベルごとに関数を作り、番号を閉包で覚えます。設定より低いレベルは、すぐに戻ります。
language: lua
project: log.lua
repo: https://github.com/rxi/log.lua
license: MIT
copyright: Copyright (c) 2016 rxi
commit: "7396ae2ee6d68829aecbc96d0b2ee1e5620c1ed7"
file: log.lua
lines: [55, 87]
format: 2
function: log.trace
difficulty: 3
tags: [クロージャ, 設計パターン, メタプログラミング]
---
## ひとことで

このループは、`trace`、`debug`、`info` などのレベルごとに、ログを出す関数を一つずつ作ります。各関数は、自分の番号 `i` を閉包で覚えています。呼ばれたときに、その番号が設定のレベルより低ければ、何もせずに戻ります。同じ形の関数を、レベルの数だけ並べるための仕組みです。

## コード

:::: code-group

```lua:line-numbers=55 [日本語訳]
for i, x in ipairs(modes) do
  local nameupper = x.name:upper()
  log[x.name] = function(...)
    
    -- ログのレベルより低ければ、すぐ戻る
    if i < levels[log.level] then
      return
    end

    local msg = tostring(...)
    local info = debug.getinfo(2, "Sl")
    local lineinfo = info.short_src .. ":" .. info.currentline

    -- コンソールへ出力する
    print(string.format("%s[%-6s%s]%s %s: %s",
                        log.usecolor and x.color or "",
                        nameupper,
                        os.date("%H:%M:%S"),
                        log.usecolor and "\27[0m" or "",
                        lineinfo,
                        msg))

    -- ログファイルへ出力する
    if log.outfile then
      local fp = io.open(log.outfile, "a")
      local str = string.format("[%-6s%s] %s: %s\n",
                                nameupper, os.date(), lineinfo, msg)
      fp:write(str)
      fp:close()
    end

  end
end
```

```lua:line-numbers=55 [原文]
for i, x in ipairs(modes) do
  local nameupper = x.name:upper()
  log[x.name] = function(...)
    
    -- Return early if we're below the log level
    if i < levels[log.level] then
      return
    end

    local msg = tostring(...)
    local info = debug.getinfo(2, "Sl")
    local lineinfo = info.short_src .. ":" .. info.currentline

    -- Output to console
    print(string.format("%s[%-6s%s]%s %s: %s",
                        log.usecolor and x.color or "",
                        nameupper,
                        os.date("%H:%M:%S"),
                        log.usecolor and "\27[0m" or "",
                        lineinfo,
                        msg))

    -- Output to log file
    if log.outfile then
      local fp = io.open(log.outfile, "a")
      local str = string.format("[%-6s%s] %s: %s\n",
                                nameupper, os.date(), lineinfo, msg)
      fp:write(str)
      fp:close()
    end

  end
end
```

::::

## 前提知識

- **閉包**: 関数の中で作られた関数が、外側の変数を覚えたまま使い続けられる仕組みです。ここでは、`i` と `nameupper` が、それぞれの関数に閉じ込められます。
- **ループの変数のずれ**: `for i, x in ipairs(...)` の `i` は、ループごとに新しく作られる変数です。そのため、各関数は、作られた時点の `i` を正しく覚えます。
- **`debug.getinfo`**: 呼び出し元の場所を取り出す標準関数です。`2` は、ログを呼んだ場所を指します。
- **`os.date`**: 今の時刻を、書式に合わせて取り出す標準関数です。

## 何をしているか

### 1. 出す必要がなければ戻る

`i < levels[log.level]` が真なら、設定より重要度が低いので、`return` で終わります。ここが、ログの絞り込みの本体です。

```lua:line-numbers=60
    if i < levels[log.level] then
      return
    end
```

### 2. 呼び出し元の場所と、メッセージを作る

`tostring(...)` で引数をまとめ、`debug.getinfo(2, "Sl")` で、呼び出し元のファイル名と行番号を取り出します。

```lua:line-numbers=64
    local msg = tostring(...)
    local info = debug.getinfo(2, "Sl")
```

### 3. コンソールとファイルに出す

色の指定、レベルの名前、時刻、場所、メッセージを整えて `print` します。`log.outfile` が設定されていれば、同じ内容をファイルへも追記します。

```lua:line-numbers=69
    print(string.format("%s[%-6s%s]%s %s: %s",
                        log.usecolor and x.color or "",
                        nameupper,
                        os.date("%H:%M:%S"),
                        log.usecolor and "\27[0m" or "",
                        lineinfo,
                        msg))
```

```lua:line-numbers=78
    if log.outfile then
      local fp = io.open(log.outfile, "a")
      local str = string.format("[%-6s%s] %s: %s\n",
                                nameupper, os.date(), lineinfo, msg)
      fp:write(str)
      fp:close()
    end
```

## ここがすごい

- **レベルごとの関数が自然に生まれる**: 関数を一つずつ書かずに、表の内容から全レベルの関数を作れます。新しいレベルも、表に足すだけです。
- **閉包が状態を持つ**: レベルの番号と名前を、関数ごとに持たせています。呼び出しのたびに、引数で渡す必要がありません。
- **早すぎる処理を省く**: 出さないログは、メッセージの整形より前に戻るので、無駄な計算をしません。
- **注意点**: ループで閉包を作るとき、変数が共有されるかどうかに注意が必要です。ここでは `for` の変数が毎回新しいので、問題が起きません。

## まとめ

- 同じ形の関数をいくつも作るときは、ループと閉包を組み合わせると、一つの書き方で済む。
- 絞り込みは、重い処理の前に行うと、出力しないログの費用を抑えられる。
- ループの変数が閉包にどう取り込まれるかを理解しておくと、同じ罠を避けられる。
