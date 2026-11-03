---
title: 値の型で表示を振り分ける、Inspector の putValue
description: Lua の表示ライブラリ inspect.lua の Inspector:putValue。値の型に応じて、文字列、数、表、その他の表示方法を選びます。表の中身は、再帰的に同じ関数で表示します。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [271, 336]
format: 2
function: Inspector:putValue
difficulty: 3
tags: [再帰, 設計パターン, 可読性]
---
## ひとことで

`Inspector:putValue(v)` は、値 `v` を、読みやすい文字列の形で出力用のバッファに書き込むメソッドです。値の型を調べ、文字列なら引用符つきで、数や真偽値ならそのまま、表なら中身を再帰的に書き出します。型ごとの表示の規則が、一つの関数に集まっています。

## コード

```lua:line-numbers=271
function Inspector:putValue(v)
   local buf = self.buf
   local tv = type(v)
   if tv == 'string' then
      puts(buf, smartQuote(escape(v)))
   elseif tv == 'number' or tv == 'boolean' or tv == 'nil' or
      tv == 'cdata' or tv == 'ctype' then
      puts(buf, tostring(v))
   elseif tv == 'table' and not self.ids[v] then
      local t = v

      if t == inspect.KEY or t == inspect.METATABLE then
         puts(buf, tostring(t))
      elseif self.level >= self.depth then
         puts(buf, '{...}')
      else
         if self.cycles[t] > 1 then puts(buf, fmt('<%d>', self:getId(t))) end

         local keys, keysLen, seqLen = getKeys(t)

         puts(buf, '{')
         self.level = self.level + 1

         for i = 1, seqLen + keysLen do
            if i > 1 then puts(buf, ',') end
            if i <= seqLen then
               puts(buf, ' ')
               self:putValue(t[i])
            else
               local k = keys[i - seqLen]
               tabify(self)
               if isIdentifier(k) then
                  puts(buf, k)
               else
                  puts(buf, "[")
                  self:putValue(k)
                  puts(buf, "]")
               end
               puts(buf, ' = ')
               self:putValue(t[k])
            end
         end

         local mt = getmetatable(t)
         if type(mt) == 'table' then
            if seqLen + keysLen > 0 then puts(buf, ',') end
            tabify(self)
            puts(buf, '<metatable> = ')
            self:putValue(mt)
         end

         self.level = self.level - 1

         if keysLen > 0 or type(mt) == 'table' then
            tabify(self)
         elseif seqLen > 0 then
            puts(buf, ' ')
         end

         puts(buf, '}')
      end

   else
      puts(buf, fmt('<%s %d>', tv, self:getId(v)))
   end
end
```

## 前提知識

- **メソッド `self:putValue(...)`**: `self` を暗黙に渡して呼ぶ書き方です。`self.buf` や `self.level` を通じて、出力の状態を共有します。
- **`type(v)`**: 値の型名を文字列で返す標準関数です。`"string"` や `"table"` などを比べて分岐します。
- **`puts` と `buf`**: バッファに文字列を追記する内部の関数と、その入れ物です。最後に、まとめて文字列として取り出します。
- **循環の印**: 同じ表が二度出てきたときは、`<番号>` のように番号だけを書きます。これは、`ids` の表で管理されます。

## 何をしているか

### 1. 型で分岐する

まずバッファを取り出し、値の型 `tv` を調べます。型によって、書き方を変えます。

```lua:line-numbers=272
   local buf = self.buf
   local tv = type(v)
   if tv == 'string' then
```

### 2. 文字列と、単純な値を書く

文字列は、エスケープと引用符の処理を経て書きます。数や真偽値、`nil` などは、`tostring` の結果をそのまま書きます。

```lua:line-numbers=275
      puts(buf, smartQuote(escape(v)))
   elseif tv == 'number' or tv == 'boolean' or tv == 'nil' or
      tv == 'cdata' or tv == 'ctype' then
      puts(buf, tostring(v))
```

### 3. 表は、中身を再帰的に書く

表の要素は、一つずつ `self:putValue` で書きます。配列の部分は値だけを、それ以外は `キー = 値` の形で並べます。

```lua:line-numbers=296
            if i <= seqLen then
               puts(buf, ' ')
               self:putValue(t[i])
            else
```

### 4. その他の値は、型と番号で書く

関数や、ユーザーデータなどは、中身を見せずに、型名と番号を `<型 番号>` の形で書きます。

```lua:line-numbers=333
   else
      puts(buf, fmt('<%s %d>', tv, self:getId(v)))
   end
```

## ここがすごい

- **規則が一か所に集まる**: 表示の書き方を、型ごとに一つの関数にまとめています。仕様を変えたいときも、ここを直せば済みます。
- **自分自身を呼んで入れ子を表す**: 表の中の値も、同じ関数で書けます。入れ子の深さに関係なく、同じ規則で表示できます。
- **循環や重複を、番号で安全に表す**: 同じ表が再び出てきても、番号で指すだけなので、無限に書き出すことを防ぎます。
- **注意点**: 再帰の深さが非常に深いと、スタックを使い切るおそれがあります。大きな入れ子の表は、深さの上限を設けて扱うのが安全です。

## まとめ

- 値を見やすく書くには、型ごとの規則を一つの関数に集めると、仕様が追いやすい。
- 入れ子の構造は、同じ関数を再帰的に呼ぶと、深さに関係なく同じ規則で書ける。
- 循環する構造は、番号で参照すると、表示が無限に続くことを防げる。
