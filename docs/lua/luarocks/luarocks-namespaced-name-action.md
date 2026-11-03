---
title: 入力の名前を、rock か名前空間つきかで振り分ける
description: Lua のパッケージマネージャ LuaRocks の util.namespaced_name_action。コマンドの引数を、rockspec や rock のファイル名か、名前空間つきのパッケージ名かに分けて、args に入れます。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [370, 385]
format: 2
function: util.namespaced_name_action
difficulty: 2
tags: [文字列処理, 正規表現, 防御的プログラミング]
---
## ひとことで

`util.namespaced_name_action(args, target, ns_name)` は、コマンドラインで受け取った名前を、適切な場所に振り分ける関数です。`.rockspec` や `.rock` で終わるファイル名は、そのまま保存します。それ以外の名前は、「名前空間/パッケージ名」の形かを調べて、パッケージ名と名前空間に分けて保存します。

## コード

```lua:line-numbers=370
function util.namespaced_name_action(args, target, ns_name)

   if not ns_name then
      return
   end

   if ns_name:match("%.rockspec$") or ns_name:match("%.rock$") then
      args[target] = ns_name
   else
      local name, namespace = util.split_namespace(ns_name)
      args[target] = name:lower()
      if namespace then
         args.namespace = namespace:lower()
      end
   end
end
```

## 前提知識

- **`args` と `target`**: コマンドの引数を集めた表と、そこに入れる鍵の名前です。関数は、この表に結果を書き込みます。
- **`match("%.rockspec$")`**: 文字列の末尾が `.rockspec` かを調べるパターンです。`$` は末尾を表し、`%.` はドットそのものを表します。
- **`util.split_namespace`**: `名前空間/名前` の形を二つに分ける関数です。形が合わなければ、元の名前をそのまま返します。
- **小文字化 `lower()`**: パッケージ名は、比べるときに大文字と小文字を区別しないように、小文字で保存します。

## 何をしているか

### 1. 名前がなければ何もしない

`ns_name` が `nil` なら、そのまま `return` して終わります。引数が省略されたときに、後の処理でエラーにならないようにします。

```lua:line-numbers=371

   if not ns_name then
      return
   end
```

### 2. ファイル名なら、そのまま保存する

名前が `.rockspec` か `.rock` で終わるなら、ファイルの指定とみなし、`args[target]` にそのまま入れます。大文字小文字は変えません。

```lua:line-numbers=376
   if ns_name:match("%.rockspec$") or ns_name:match("%.rock$") then
      args[target] = ns_name
```

### 3. 名前空間つきなら、分けて保存する

それ以外は、`split_namespace` で名前空間とパッケージ名に分けます。パッケージ名は小文字にして `args[target]` に入れ、名前空間があれば `args.namespace` にも入れます。

```lua:line-numbers=379
      local name, namespace = util.split_namespace(ns_name)
      args[target] = name:lower()
      if namespace then
         args.namespace = namespace:lower()
      end
```

## ここがすごい

- **入力の種類を自動で見分ける**: 利用者は、ファイル名でもパッケージ名でも、同じ引数の場所に書けます。
- **大文字を揃える**: 名前を小文字にそろえるので、`Lpeg` と `lpeg` が同じものとして扱われます。
- **名前空間を分けて保存**: 名前とは別の場所に名前空間を置くので、後の処理で、どちらの情報も取り出せます。
- **注意点**: ファイル名の判定は、末尾の文字だけで行います。`.rock` で終わるパッケージ名は、ファイルとして扱われるので、名前の付け方に注意が必要です。

## まとめ

- 入力の形が複数あるときは、判定の順番を決めて振り分けると、利用者が形を気にせず使える。
- 大文字と小文字のような表記の揺れは、保存の前に統一すると、後の比較が安定する。
- 分けて保存する情報は、別の鍵に入れると、必要なものだけを後で取り出せる。
