---
title: "英語の冠詞を末尾に移して、冠詞を無視した順に並べる"
description: "Humanizer の EnglishArticle.AppendArticlePrefix。\"The Beatles\" を \"Beatles The\" に書き換えてから並べ替え、冠詞を無視して名前順に並ぶようにする。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/ArticlePrefixSort.cs
lines: [13, 43]
function: "EnglishArticle.AppendArticlePrefix(string[])"
difficulty: 2
format: 2
tags: [文字列処理, ソート, イディオム]
---

## ひとことで

`AppendArticlePrefix` は、文字列の先頭にある英語の冠詞（`The`、`A`、`An` など）を **末尾へ移してから** 並べ替える関数です。
たとえば `"The Beatles"` は `"Beatles The"` に変わり、`B` の並びに入ります。

書籍や音楽のタイトルを、冠詞を無視して並べる、という場面で使われます。

## コード

```csharp:line-numbers=13
    public static string[] AppendArticlePrefix(string[] items)
    {
        if (items.Length == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(items));
        }

        var transformed = new string[items.Length];

        for (var i = 0; i < items.Length; i++)
        {
            var item = items[i]
                .AsSpan();
            if (TryGetArticlePrefixLength(item, out var articleLength))
            {
                var removed = item[articleLength..]
                    .TrimStart();
                var article = item[..articleLength];
                transformed[i] = $"{removed} {article}";
            }
            else
            {
                transformed[i] = item
                    .Trim()
                    .ToString();
            }
        }

        Array.Sort(transformed);
        return transformed;
    }
```

## 前提知識

- **冠詞（article）**: `a`、`an`、`the` などの、名詞の前に付く単語です。並べ替えでは、無視されることが多いです。
- **`ReadOnlySpan<char>`**: 文字列の一部を、コピーせずに指す型です。`[..n]` と `[n..]` で、一部分を取り出せます。
- **`TrimStart` と `Trim`**: 文字列の前や後ろの空白を取り除く関数です。
- **補間文字列（`$"..."`）**: 変数を埋め込んで文字列を作る書き方です。
- **`Array.Sort`**: 配列を並べ替える .NET の関数です。文字列は、既定の比べ方で並びます。

## 何をしているか

### 1. 空の配列を弾く

```csharp:line-numbers=15
        if (items.Length == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(items));
        }
```

要素が 1 つもないときは、例外を投げます。

### 2. 結果の配列を用意する

```csharp:line-numbers=20
        var transformed = new string[items.Length];
```

並べ替えの前の、書き換えた文字列を入れる配列を作ります。

### 3. 先頭が冠詞かを調べる

```csharp:line-numbers=22
        for (var i = 0; i < items.Length; i++)
        {
            var item = items[i]
                .AsSpan();
            if (TryGetArticlePrefixLength(item, out var articleLength))
```

各要素の先頭が冠詞なら、その長さを取り出します。冠詞を見つけたときだけ、次の書き換えを行います。

### 4. 冠詞を末尾に移す

```csharp:line-numbers=28
                var removed = item[articleLength..]
                    .TrimStart();
                var article = item[..articleLength];
                transformed[i] = $"{removed} {article}";
```

冠詞の前にある部分と、冠詞そのものを分けます。冠詞の前の空白を取り除き、「残りの部分 + 空白 + 冠詞」の形に組み直します。

### 5. 冠詞がなければ、空白だけ取り除く

```csharp:line-numbers=33
            else
            {
                transformed[i] = item
                    .Trim()
                    .ToString();
            }
```

冠詞がない要素は、前後の空白を取り除くだけで、そのまま使います。

### 6. 並べ替えて返す

```csharp:line-numbers=41
        Array.Sort(transformed);
        return transformed;
```

書き換えた配列を並べ替えて、結果として返します。冠詞が末尾に移っているので、名前の部分で並ぶようになります。

## ここがすごい

- **部分をコピーせずに指せる**: `ReadOnlySpan<char>` を使うと、冠詞とその後ろの部分を、コピーせずに別々に指せます。
- **書き換えと並べ替えを分けている**: 書き換えは 1 回のループで済み、並べ替えは既存の `Array.Sort` に任せています。
- **冠詞がない場合も同じ形で返る**: 冠詞の有無にかかわらず、結果は並べ替えられる文字列の配列になります。

## まとめ

- 冠詞が先頭にあれば、それを末尾へ移す形に書き換える。
- 冠詞がなければ、前後の空白を取り除くだけにする。
- 書き換えた配列を並べ替えて返す。
