---
title: "クラス名からファイルを探して、安全に読み込む"
description: "Composer の ClassLoader::loadClass は、クラス名に対応するファイルを探して読み込みます。ファイルを読む処理を、外の変数が見えない専用のクロージャに任せているのが工夫です。"
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "ae54d59bec96633ae442a009f3793b0b450351cd"
file: src/Composer/Autoload/ClassLoader.php
lines: [423, 433]
function: ClassLoader::loadClass
difficulty: 3
format: 2
tags: [標準ライブラリ, イディオム, クロージャ, 設計パターン]
---

## ひとことで

`loadClass` は、PHP がまだ知らないクラス名（たとえば `Monolog\Logger`）が使われたときに呼ばれる関数です。Composer が作った「どのクラスがどのファイルか」の表から探して、そのファイルを読み込みます。`composer install` の後にプロジェクトのクラスが動く仕組みの中心です。

## コード

```php:line-numbers=423
    public function loadClass($class)
    {
        if ($file = $this->findFile($class)) {
            $includeFile = self::$includeFile;
            $includeFile($file);

            return true;
        }

        return null;
    }
```

## 前提知識

- **オートロード**: クラスを使う直前に、自動でファイルを読み込む仕組みです。`require` を毎回書かずに済みます。
- **`spl_autoload_register`**: 知らないクラスが出たときに呼んでほしい関数を、PHP に登録する関数です。`register()` がこれを行います。
- **`include`**: ファイルを読み込んで中身を実行する命令です。
- **クロージャの束縛**: 無名関数を、どのオブジェクトやスコープの変数を見えるようにするかを決めて作ることです。
- **`null` 返し**: 「このローダーは担当外」という意味で、次のローダーに任せるときに使われます。

## 何をしているか

### 1. ファイルを探す

```php:line-numbers=425
        if ($file = $this->findFile($class)) {
```

`findFile($class)` で、クラス名に対応するファイルのパスを探します。見つかれば文字列のパスが、見つからなければ `false` が返ります。探す仕事は `findFile` に任せ、`loadClass` は読み込みだけを担当します。

### 2. 読み込みを専用のクロージャに任せる

```php:line-numbers=426
            $includeFile = self::$includeFile;
            $includeFile($file);
```

`self::$includeFile` は、Composer が用意した「`include` だけをするクロージャ」です。`$includeFile($file);` と呼ぶことで、ファイルが読み込まれます。`$this` や `$class` といった、`loadClass` の中の変数はこのクロージャから見えません。

### 3. 読めたら `true`、担当外なら `null`

```php:line-numbers=428

            return true;
        }

        return null;
```

読み込みに成功したら `true` を返します。見つからなかった場合は `null` を返し、PHP は次の登録済みのローダーに任せます。`false` ではなく `null` を使うのは、「失敗した」ではなく「自分の担当ではない」を表すためです。

具体例として `Monolog\Logger` を探すと、`findFile` が `vendor/monolog/monolog/src/Monolog/Logger.php` のようなパスを返し、`$includeFile` がそれを読み込みます。

## ここがすごい

### 読み込みの場所を、外の変数から切り離している

ファイルを `include` すると、そのファイルのコードは「呼び出された場所の変数」を見られます。もし `loadClass` の中で直接 `include $file;` と書くと、読み込まれるファイルが `$class` や `$this` を勝手に使えてしまいます。Composer は、`include` だけを行う専用のクロージャを作り、そこで読み込みます。こうすると、読み込むファイルは白紙の状態から始まります。

### 「探す」と「読む」を分けている

`findFile` は探すだけで、副作用（読み込み）はしません。`loadClass` は読み込みだけをします。そのため、クラスが存在するかを確かめたいだけの処理（`findFile` だけを呼ぶ）も、読み込みをせずに済みます。役割が分かれているので、テストもしやすくなっています。

### `false` と `null` を使い分ける

`findFile` は、存在しないときに `false` を返します。`loadClass` は、その結果を使って `true` か `null` を返します。PHP のオートローダーは、`null` を返すと次のローダーを試してくれるので、複数のローダーを重ねられます。

## まとめ

- オートロードは、クラス名からファイルを探す処理と読み込む処理に分けると読みやすい。
- 読み込みを専用のクロージャに任せると、読み込むファイルが外の変数を見られない。
- 「見つからない」は `null` で返し、次の担当に渡すと複数のローダーを重ねられる。
- 探すだけの処理と、読み込む処理を分けると、確認だけの用途に使いやすい。
