---
title: "プロパティが、公開された getter か setter を持つかを調べる"
description: "Newtonsoft.Json の ReflectionUtils.IsPublic(PropertyInfo)。プロパティの getter か setter のどちらかが public なら true を返す。JSON の対象にする項目を決めるのに使う。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/ReflectionUtils.cs
lines: [129, 143]
function: "ReflectionUtils.IsPublic(PropertyInfo)"
difficulty: 1
format: 2
tags: [リフレクション, 型システム, 防御的プログラミング]
---

## ひとことで

`IsPublic` は、プロパティが **外部から読めるか、書けるか** を、リフレクションで調べる関数です。
プロパティの値を読む getter か、書き込む setter のどちらかが `public` なら、`true` を返します。

たとえば、読み取りだけ公開されているプロパティは `true` です。どちらも公開されていなければ `false` です。

## コード

```csharp:line-numbers=129
        public static bool IsPublic(PropertyInfo property)
        {
            var getMethod = property.GetGetMethod();
            if (getMethod != null && getMethod.IsPublic)
            {
                return true;
            }
            var setMethod = property.GetSetMethod();
            if (setMethod != null && setMethod.IsPublic)
            {
                return true;
            }

            return false;
        }
```

## 前提知識

- **プロパティ**: 値の読み書きを、メソッドのように見せる仕組みです。内部では、読む `get` と、書く `set` のメソッドで動きます。
- **リフレクション**: 実行中に、型やメンバの情報を調べる仕組みです。`PropertyInfo` は、プロパティの情報を表します。
- **`GetGetMethod` と `GetSetMethod`**: プロパティの `get` と `set` のメソッドを、`MethodInfo` として取り出す関数です。ない場合は `null` になります。
- **`IsPublic`**: そのメソッドが、外部から呼べる `public` かを表す値です。
- **`public` の意味**: 型の外からアクセスできる、という意味です。

## 何をしているか

### 1. getter が公開されているか確かめる

```csharp:line-numbers=131
            var getMethod = property.GetGetMethod();
            if (getMethod != null && getMethod.IsPublic)
            {
                return true;
```

`get` のメソッドを取り出し、`null` ではなく、`public` なら `true` を返します。

### 2. setter が公開されているか確かめる

```csharp:line-numbers=136
            var setMethod = property.GetSetMethod();
            if (setMethod != null && setMethod.IsPublic)
            {
                return true;
            }
```

`get` が公開されていなくても、`set` が公開されていれば `true` を返します。

### 3. どちらも公開されていなければ false

```csharp:line-numbers=142
            return false;
```

どちらにも当てはまらなければ、外部から使えないプロパティなので、`false` を返します。

## ここがすごい

- **読み書きのどちらかで判定**: 読めるだけでも、書けるだけでも、公開として扱うので、JSON の対象を広く拾えます。
- **`null` を先に確かめる**: アクセサがないプロパティを、例外にせず安全に扱います。
- **読みやすい形**: 2 つのアクセサを、同じ形で順に調べるので、流れが追いやすい関数です。

## まとめ

- getter が `public` なら `true` を返す。
- setter が `public` なら `true` を返す。
- どちらも公開されていなければ `false` を返す。
