---
title: "型が辞書の仲間かを、継承の関係から判定する"
description: "Newtonsoft.Json の CollectionUtils.IsDictionaryType。IDictionary、IDictionary<,>、IReadOnlyDictionary<,> のいずれかを実装しているかを、リフレクションで調べる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [98, 119]
function: "CollectionUtils.IsDictionaryType(Type)"
difficulty: 2
format: 2
tags: [リフレクション, 型システム, ジェネリクス]
---

## ひとことで

`IsDictionaryType` は、与えられた **型** が辞書（キーと値の対応を持つ型）の仲間かを判定する関数です。
値ではなく、型そのものを調べます。たとえば `Dictionary<string, int>` は `true` になり、`List<int>` は `false` になります。

JSON を読み書きするとき、その型を「オブジェクトとして扱うか、辞書として扱うか」を決めるために使われます。

## コード

```csharp:line-numbers=98
        [RequiresUnreferencedCode(MiscellaneousUtils.TrimWarning)]
        public static bool IsDictionaryType(Type type)
        {
            ValidationUtils.ArgumentNotNull(type, nameof(type));

            if (typeof(IDictionary).IsAssignableFrom(type))
            {
                return true;
            }
            if (ReflectionUtils.ImplementsGenericDefinition(type, typeof(IDictionary<,>)))
            {
                return true;
            }
#if HAVE_READ_ONLY_COLLECTIONS
            if (ReflectionUtils.ImplementsGenericDefinition(type, typeof(IReadOnlyDictionary<,>)))
            {
                return true;
            }
#endif

            return false;
        }
```

## 前提知識

- **リフレクション**: 実行中に、型の情報を調べたり、操作したりする仕組みです。
- **`Type`**: 型そのものを表すオブジェクトです。
- **`IsAssignableFrom`**: ある型が、別の型の代わりに使えるか（実装しているか）を調べる関数です。
- **`IDictionary` と `IDictionary<,>`**: 辞書の共通の約束（インターフェース）です。前者は型を指定しない古い版、後者は型を指定する版です。
- **`IReadOnlyDictionary<,>`**: 読み取り専用の辞書の約束です。古い .NET では存在しないため、条件付きコンパイルで囲まれています。
- **`[RequiresUnreferencedCode]`**: 実行時の型の調べ方が、トリミング（不要なコードの削除）で壊れるおそれがあることを示す印です。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=101
            ValidationUtils.ArgumentNotNull(type, nameof(type));
```

型が `null` なら、例外を投げます。

### 2. 古い形の辞書かを調べる

```csharp:line-numbers=103
            if (typeof(IDictionary).IsAssignableFrom(type))
            {
                return true;
            }
```

`IDictionary` を実装している型なら、`true` を返します。

### 3. 型引数付きの辞書かを調べる

```csharp:line-numbers=107
            if (ReflectionUtils.ImplementsGenericDefinition(type, typeof(IDictionary<,>)))
            {
                return true;
            }
```

`IDictionary<,>` の仲間（ジェネリック型の定義）を実装しているかを調べます。`Dictionary<string, int>` はこれに当てはまります。

### 4. 読み取り専用の辞書かを調べる

```csharp:line-numbers=111
#if HAVE_READ_ONLY_COLLECTIONS
            if (ReflectionUtils.ImplementsGenericDefinition(type, typeof(IReadOnlyDictionary<,>)))
            {
                return true;
            }
```

`IReadOnlyDictionary<,>` の仲間なら、`true` を返します。この部分は、対応している環境でだけ使われます。

### 5. どれにも当てはまらなければ false

```csharp:line-numbers=118
            return false;
```

ここまで当てはまらなければ、辞書ではないと判断して、`false` を返します。

## ここがすごい

- **複数の約束を順に確かめる**: 古い形、新しい形、読み取り専用の形を、順番に調べています。どれか 1 つでも当てはまれば、辞書として扱えます。
- **型だけで判定する**: 値を作らず、型の情報だけで判定するので、速く、副作用もありません。
- **環境差を吸収する**: 条件付きコンパイルで、対応していない環境では、読み取り専用の確認を省いています。

## まとめ

- 型が `IDictionary` を実装していれば、辞書とみなす。
- 型引数付きの `IDictionary<,>` や `IReadOnlyDictionary<,>` も、同じように調べる。
- どれにも当てはまらなければ、辞書ではない。
