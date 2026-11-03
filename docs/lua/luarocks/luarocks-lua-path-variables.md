---
title: Lua のパス変数の名前を、版によって選ぶ
description: Lua のパッケージマネージャ LuaRocks の lua_path_variables。Lua のバージョンごとの環境変数名を組み立てます。5.1 以外では、版の名前付きの変数があればそちらを使います。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [179, 193]
format: 2
function: util.lua_path_variables
difficulty: 2
tags: [文字列処理, 可読性, 防御的プログラミング]
---
## ひとことで

`util.lua_path_variables()` は、Lua のモジュールを探す場所を指定する環境変数の名前を、2 つ返す関数です。Lua 5.1 では `LUA_PATH` と `LUA_CPATH` を使います。5.1 以外では、`LUA_PATH_5_4` のように版の名前が付いた変数が設定されていれば、そちらの名前を選びます。

## コード

```lua:line-numbers=179
function util.lua_path_variables()
   local lpath_var = "LUA_PATH"
   local lcpath_var = "LUA_CPATH"

   local lv = cfg.lua_version:gsub("%.", "_")
   if lv ~= "5_1" then
      if os.getenv("LUA_PATH_" .. lv) then
         lpath_var = "LUA_PATH_" .. lv
      end
      if os.getenv("LUA_CPATH_" .. lv) then
         lcpath_var = "LUA_CPATH_" .. lv
      end
   end
   return lpath_var, lcpath_var
end
```

## 前提知識

- **環境変数**: OS が持つ、プログラムへの設定の受け渡しの仕組みです。`os.getenv("名前")` で値を読めます。
- **`cfg.lua_version`**: LuaRocks が持つ設定の一つで、対象の Lua の版を表す文字列です。`5.4` のような形です。
- **`gsub("%.", "_")`**: 文字列の中のドットを、アンダースコアに置き換えます。`%.` は、ドットそのものを表すパターンです。
- **`..` による連結**: 文字列どうしを、つなげる演算子です。変数名を組み立てるのに使われます。

## 何をしているか

### 1. 版の名前を、変数名に使える形にする

`cfg.lua_version` の `5.4` のようなドットを、`_` に置き換えます。これで、`5_4` のような形になり、環境変数の名前として使えます。

```lua:line-numbers=180
   local lpath_var = "LUA_PATH"
   local lcpath_var = "LUA_CPATH"

   local lv = cfg.lua_version:gsub("%.", "_")
```

### 2. 5.1 以外なら、版付きの変数があるか確かめる

版が `5_1` でないときは、`LUA_PATH_` に版を付けた名前の環境変数が設定されているかを調べます。設定されていれば、その名前を選びます。`LUA_CPATH` も同じように調べます。

```lua:line-numbers=184
   if lv ~= "5_1" then
      if os.getenv("LUA_PATH_" .. lv) then
         lpath_var = "LUA_PATH_" .. lv
      end
      if os.getenv("LUA_CPATH_" .. lv) then
         lcpath_var = "LUA_CPATH_" .. lv
      end
   end
```

### 3. 二つの名前を返す

最後に、選ばれた二つの変数名を返します。どちらも、設定がなければ、基本の `LUA_PATH` と `LUA_CPATH` のままです。

```lua:line-numbers=192
   return lpath_var, lcpath_var
```

## ここがすごい

- **既定の名前から始める**: まず基本の名前を用意し、版付きの変数があるときだけ置き換えます。設定がなくても、必ず正しい名前が返ります。
- **二つを独立に決める**: パスの変数と C のパスの変数を、別々に確かめています。片方だけ版付きでも、正しく動きます。
- **名前だけを返す**: 値を読まずに名前を返すので、呼ぶ側が、どちらを使うかを決められます。
- **注意点**: 版付きの環境変数が空文字でも、設定されているとみなされます。`os.getenv` の結果が `nil` かどうかだけを見ているためです。

## まとめ

- 既定の名前を先に決め、特別な名前があるときだけ置き換えると、設定がなくても正しく動く。
- 版ごとに変わる名前は、版の文字列を組み立てて、存在を確かめると切り替えられる。
- 名前だけを返すと、値の読み込みは呼ぶ側に任せられ、関数の役割が小さくなる。
