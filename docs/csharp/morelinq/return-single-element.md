---
title: "要素を 1 つだけ持つ、変更できない列を作る"
description: "MoreLINQ の Return。1 つの値だけを持つ読み取り専用の列を作る。IList と IReadOnlyList を実装し、変更の操作は例外にする。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Return.cs
lines: [35, 54]
function: "MoreEnumerable.Return<T>(T)"
difficulty: 2
format: 2
tags: [データ構造, 型システム, イテレータ]
---

## ひとことで

`Return(item)` は、**要素を 1 つだけ持つ列** を作る関数です。
たとえば `Return(5)` は、`5` だけが並んだ列になります。

作られた列は、中身を変えられません。`Add` や `Remove` などの変更操作は、呼ばれると例外を投げます。

## コード

```csharp:line-numbers=35
        sealed class SingleElementList<T>(T item) : IList<T>, IReadOnlyList<T>
        {
            readonly T item = item;

            public int Count       => 1;
            public bool IsReadOnly => true;

            public T this[int index]
            {
                get => index == 0 ? this.item : throw new ArgumentOutOfRangeException(nameof(index));
                set => throw ReadOnlyException();
            }

            public IEnumerator<T> GetEnumerator() { yield return this.item; }
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

            public int IndexOf(T item) => Contains(item) ? 0 : -1;
            public bool Contains(T item) => EqualityComparer<T>.Default.Equals(this.item, item);

            public void CopyTo(T[] array, int arrayIndex) => array[arrayIndex] = this.item;
```

## 前提知識

- **`IList<T>` / `IReadOnlyList<T>`**: 要素に番号（インデックス）で触れる列の共通の約束（インターフェース）です。`IReadOnlyList<T>` は読むだけの約束です。
- **プライマリコンストラクタ（`SingleElementList<T>(T item)`）**: クラス名の後ろに引数を書いて、初期化を省略できる書き方です。
- **`=>`（式形式のメンバ）**: 1 行の式で、メンバの中身を書く書き方です。
- **`throw` 式**: 式の中で例外を投げる書き方です。`?:` の一方に置いて、条件付きで使えます。
- **`yield return`**: 値を 1 つずつ返す書き方です。

## 何をしているか

### 1. 要素を 1 つだけ持つ列を作る

```csharp:line-numbers=33
        public static IEnumerable<T> Return<T>(T item) => new SingleElementList<T>(item);
```

`Return` は、`SingleElementList<T>` という専用のクラスを作って返します。このクラスは中に 1 つの値を持ちます。

### 2. 番号で要素を読む

```csharp:line-numbers=42
            public T this[int index]
            {
                get => index == 0 ? this.item : throw new ArgumentOutOfRangeException(nameof(index));
                set => throw ReadOnlyException();
            }
```

`this[index]` の `get` では、番号が `0` のときだけ値を返します。`0` 以外の番号は、範囲外の例外を投げます。`set` は、読み取り専用なので例外を投げます。

### 3. 列として取り出す

```csharp:line-numbers=48
            public IEnumerator<T> GetEnumerator() { yield return this.item; }
```

`GetEnumerator` は、`yield return` で中身の 1 つを返します。これで `foreach` で回せるようになります。

### 4. 変更の操作は例外にする

```csharp:line-numbers=58
            public void Add(T item)               => throw ReadOnlyException();
            public void Clear()                   => throw ReadOnlyException();
            public bool Remove(T item)            => throw ReadOnlyException();
            public void Insert(int index, T item) => throw ReadOnlyException();
            public void RemoveAt(int index)       => throw ReadOnlyException();
```

`Add`、`Clear`、`Remove`、`Insert`、`RemoveAt` は、呼ばれると `ReadOnlyException` を投げます。これで、列の中身が変わることを防ぎます。

## ここがすごい

- **1 つの値だけを持つ**: 要素を並べた配列を作らず、値 1 つだけを保存します。作るコストが小さいです。
- **型の約束を守る**: `IList<T>` を実装しているので、`IList<T>` を受け取る関数にそのまま渡せます。変更の操作は、例外で明示的に禁止しています。
- **読むだけの列を安全に渡せる**: 中身が変わらないことが保証されるので、呼び出し側は安心して列を渡せます。

## まとめ

- `Return(item)` は、1 つの値だけを持つ列を作る。
- 番号 `0` の値だけを読め、変更の操作は例外になる。
- 変更できない列として、安全に受け渡しできる。
