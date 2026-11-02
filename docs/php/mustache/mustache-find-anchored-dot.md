---
title: 先頭にドットがついた名前を、現在の文脈から順にたどる
description: mustache.php の findAnchoredDot は、{{.name.sub}} のように先頭がドットで始まる名前を、今いる文脈の値から順にたどって探します。文脈を広げずに、現在のデータの中だけで名前を解決するための関数です。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Context.php
lines: [253, 272]
function: findAnchoredDot
difficulty: 2
format: 2
tags: [探索, データ構造, 再帰]
---
## ひとことで

`findAnchoredDot` は、Mustache のテンプレートの中で `{{.name.sub}}` のように、先頭にドットを付けて書かれた名前の値を探す関数です。普通の変数の探し方は、外側の文脈まで遡ります。先頭にドットがあると、現在の値の中だけで探すことを表します。

## コード

```php:line-numbers=253
    public function findAnchoredDot($id, $strictCallables = false, $strictTag = Engine::STRICT_INTERPOLATION)
    {
        $chunks = explode('.', $id);
        if ($chunks[0] !== '') {
            throw new InvalidArgumentException(sprintf('Unexpected id for findAnchoredDot: %s', $id));
        }

        $value = $this->last();
        $chunkCount = count($chunks);

        for ($i = 1; $i < $chunkCount; $i++) {
            if ($value === '') {
                return $value;
            }

            $value = $this->findVariableInStack($chunks[$i], [$value], 1, $strictTag);
        }

        return $value;
    }
```

## 前提知識

- **文脈（コンテキスト）**: Mustache では、描画中にいる場所のデータを表します。区間の中に入ると、そのデータが新しい文脈として積まれ、外に出ると元の文脈に戻ります。
- **ドット記法**: `person.name` のように、ドットで区切って、値の中の値を順にたどる書き方です。
- **`explode`**: 文字列を、区切り文字で分けて配列にする関数です。
- **`findVariableInStack`**: 文脈の積み重ねから、名前に当たる値を探すメソッドです。ここでは、1 つだけの配列を文脈として渡して使っています。
- **`InvalidArgumentException`**: 引数が正しくないときに投げる例外です。

## 何をしているか

### 1. 先頭がドットかを確かめる

```php:line-numbers=255
        $chunks = explode('.', $id);
        if ($chunks[0] !== '') {
            throw new InvalidArgumentException(sprintf('Unexpected id for findAnchoredDot: %s', $id));
        }
```

名前を `.` で分けた最初の要素が空文字でなければ、先頭にドットが無いので、呼び出し方が間違っています。例外を投げて知らせます。`{{.name}}` の形になっているときだけ、この関数が使われるべきだからです。

### 2. 今の文脈の値から始める

```php:line-numbers=260
        $value = $this->last();
        $chunkCount = count($chunks);
```

`$this->last()` で、今の文脈の一番上の値を取り出します。ここが、探し始める出発点になります。配列の要素の数も、後の繰り返しのために数えておきます。

### 3. 1 つずつ子をたどる

```php:line-numbers=263
        for ($i = 1; $i < $chunkCount; $i++) {
            if ($value === '') {
                return $value;
            }

            $value = $this->findVariableInStack($chunks[$i], [$value], 1, $strictTag);
        }
```

2 つ目以降の名前を、順に `findVariableInStack` で探します。途中の値が空文字になったら、そこで打ち切って空文字を返します。値は、その 1 つだけを含む配列を文脈にして探されるので、外側の文脈へは遡りません。

### 4. 最後の値を返す

```php:line-numbers=271
        return $value;
```

全部の名前をたどり終えた値を返します。

## ここがすごい

- 探索の範囲を、今の値の中だけに絞る仕組みを、ドットの有無という 1 つの印で表しています。テンプレートを読む人も、書く人も、その意味が分かりやすくなっています。
- 文脈の積み重ねを使わず、1 つの配列だけを渡して探しています。外側の変数が混ざらないので、区間の中で予期しない値を拾うことがありません。
- 途中で空文字になったら、それ以上たどらずに返します。存在しない値の先で、エラーになるのを防いでいます。
- 名前の先頭だけを見ているので、判定は短い比較で済みます。複雑な文法を持たずに、必要な意味を表せています。

## まとめ

`findAnchoredDot` は、先頭にドットのついた名前を、今の文脈の値から順にたどる関数です。文脈を遡らずに、現在のデータの中だけで値を探せます。ドットという小さな印が、探索の範囲を決めるという設計が、短いコードに表れています。
