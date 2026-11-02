---
title: "コンストラクタの「秘密の引数」を、属性を読んで見つける"
description: "Monolog の Utils::getSensitiveParameterNames は、クラスのコンストラクタの引数のうち、#[SensitiveParameter] が付いたものの名前を調べます。リフレクションで属性を読み、結果をクラスごとに覚えておきます。"
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Utils.php
lines: [62, 85]
function: Utils::getSensitiveParameterNames
difficulty: 3
format: 2
tags: [リフレクション, セキュリティ, キャッシュ]
---

## ひとことで

`getSensitiveParameterNames` は、クラスのコンストラクタの引数のうち、**秘密の情報（パスワードなど）と印が付いたもの** の名前を返す関数です。ログを残すときに、その値を伏せ字にするための下調べとして使われます。

## コード

::: code-group

```php:line-numbers=62 [日本語訳]
    public static function getSensitiveParameterNames(string $class): array
    {
        if (isset(self::$sensitiveParameterNames[$class])) {
            return self::$sensitiveParameterNames[$class];
        }

        $names = [];
        try {
            $constructor = (new \ReflectionClass($class))->getConstructor();
            if (null !== $constructor) {
                foreach ($constructor->getParameters() as $parameter) {
                    // IS_INSTANCEOF ではなく名前で絞るのは意図的。
                    // PHP 8.2 より前では属性のクラスがまだ存在しないため、この書き方なら動き続ける。
                    if (\count($parameter->getAttributes(\SensitiveParameter::class)) > 0) {
                        $names[$parameter->getName()] = true;
                    }
                }
            }
        } catch (\ReflectionException) {
            // クラスを読み込めないなら、できることはない。
        }

        return self::$sensitiveParameterNames[$class] = $names;
    }
```

```php:line-numbers=62 [原文]
    public static function getSensitiveParameterNames(string $class): array
    {
        if (isset(self::$sensitiveParameterNames[$class])) {
            return self::$sensitiveParameterNames[$class];
        }

        $names = [];
        try {
            $constructor = (new \ReflectionClass($class))->getConstructor();
            if (null !== $constructor) {
                foreach ($constructor->getParameters() as $parameter) {
                    // filtering by name and not IS_INSTANCEOF on purpose, so this keeps working
                    // on PHP < 8.2 where the attribute class does not exist yet
                    if (\count($parameter->getAttributes(\SensitiveParameter::class)) > 0) {
                        $names[$parameter->getName()] = true;
                    }
                }
            }
        } catch (\ReflectionException) {
            // class is not loadable, nothing we can do
        }

        return self::$sensitiveParameterNames[$class] = $names;
    }
```

:::

## 前提知識

- **リフレクション（`ReflectionClass`）**: プログラムの中で、クラスや関数の構造（引数の一覧など）を調べる PHP の仕組みです。
- **属性（アトリビュート）**: `#[...]` と書いて、クラスや引数に情報を付ける PHP の仕組みです。
- **`#[\SensitiveParameter]`**: 引数が秘密の値であることを示す属性です。PHP 8.2 から使えます。
- **`ReflectionException`**: リフレクションで失敗したときの例外です。クラスが読み込めないときなどに起こります。
- **静的プロパティ**: クラス全体で 1 つだけ持つ変数です。ここでは結果を覚えておくために使います。

## 何をしているか

### 1. 結果があれば、すぐに返す

```php:line-numbers=64
        if (isset(self::$sensitiveParameterNames[$class])) {
            return self::$sensitiveParameterNames[$class];
        }
```

同じクラスについて、前に調べた結果があれば、そのまま返します。リフレクションは比較的重い処理なので、一度だけ行うようにしています。

### 2. コンストラクタの引数を 1 つずつ見る

::: code-group

```php:line-numbers=69 [日本語訳]
        try {
            $constructor = (new \ReflectionClass($class))->getConstructor();
            if (null !== $constructor) {
                foreach ($constructor->getParameters() as $parameter) {
                    // IS_INSTANCEOF ではなく名前で絞るのは意図的。
                    // PHP 8.2 より前では属性のクラスがまだ存在しないため、この書き方なら動き続ける。
                    if (\count($parameter->getAttributes(\SensitiveParameter::class)) > 0) {
                        $names[$parameter->getName()] = true;
                    }
                }
            }
```

```php:line-numbers=69 [原文]
        try {
            $constructor = (new \ReflectionClass($class))->getConstructor();
            if (null !== $constructor) {
                foreach ($constructor->getParameters() as $parameter) {
                    // filtering by name and not IS_INSTANCEOF on purpose, so this keeps working
                    // on PHP < 8.2 where the attribute class does not exist yet
                    if (\count($parameter->getAttributes(\SensitiveParameter::class)) > 0) {
                        $names[$parameter->getName()] = true;
                    }
                }
            }
```

:::

`ReflectionClass` でクラスを調べ、コンストラクタ（`getConstructor`）の引数を取り出します。引数ごとに、`SensitiveParameter` の属性が付いているかを `getAttributes` で確かめます。付いていれば、その引数の名前を `$names` に記録します。

コメントにあるとおり、属性のクラス名で絞り込むのは、PHP 8.2 より前でも動くようにするためです。

### 3. 結果を覚えて返す

::: code-group

```php:line-numbers=80 [日本語訳]
        } catch (\ReflectionException) {
            // クラスを読み込めないなら、できることはない。
        }

        return self::$sensitiveParameterNames[$class] = $names;
```

```php:line-numbers=80 [原文]
        } catch (\ReflectionException) {
            // class is not loadable, nothing we can do
        }

        return self::$sensitiveParameterNames[$class] = $names;
```

:::

クラスが読み込めなかったときは、何もしないで空の結果にします。最後に、結果を静的なプロパティに保存して返します。

## ここがすごい

### 属性を、コードを変えずに読み取る

利用者のクラスに「この引数は秘密」と書いておくだけで、ログの伏せ字が自動で決まります。ログを出す側は、属性の存在を読み取るだけで済みます。書く側と読む側が、属性という共通の約束でつながっている設計です。

### 古い PHP でも壊れない書き方

::: code-group

```php:line-numbers=73 [日本語訳]
                    // IS_INSTANCEOF ではなく名前で絞るのは意図的。
                    // PHP 8.2 より前では属性のクラスがまだ存在しないため、この書き方なら動き続ける。
```

```php:line-numbers=73 [原文]
                    // filtering by name and not IS_INSTANCEOF on purpose, so this keeps working
                    // on PHP < 8.2 where the attribute class does not exist yet
```

:::

`IS_INSTANCEOF` で型を指定すると、属性のクラスが存在しない古い PHP ではエラーになります。名前で比べれば、属性がなくても何も起きません。コメントに理由が書かれているので、後から読んでも意図がわかります。

### 読み込めないクラスは、無理をしない

::: code-group

```php:line-numbers=80 [日本語訳]
        } catch (\ReflectionException) {
            // クラスを読み込めないなら、できることはない。
        }
```

```php:line-numbers=80 [原文]
        } catch (\ReflectionException) {
            // class is not loadable, nothing we can do
        }
```

:::

クラスが読み込めないとき、無理に例外を投げるとログの記録そのものが止まってしまいます。空の結果にすることで、ログは出し続けられます。失敗を握りつぶすのではなく、ログという目的を優先した判断です。

## まとめ

- 属性を読むと、コードの中の印を、別の処理の判断材料に使える。
- リフレクションは重いので、結果をクラスごとに覚えておくと速くなる。
- 古い環境でも動かすには、型でなく名前で比べる方法がある。
- 補助的な処理は、失敗しても本来の仕事を止めない形にすると安全。
