---
title: 名前をつけたルートを探し出す
description: Slim の RouteCollector の getNamedRoute は、名前からルートを探します。直前に見つけたルートを名前の表に覚えておき、名前が変わって古くなっていたら表から消して探し直します。
language: php
project: Slim
repo: https://github.com/slimphp/Slim
license: MIT
copyright: Copyright (c) 2011-2022 Josh Lockhart
commit: "3675bf6baac66b07032575b7bef4200b60b7974b"
file: Slim/Routing/RouteCollector.php
lines: [195, 214]
function: getNamedRoute
difficulty: 2
format: 2
tags: [キャッシュ, 探索, 防御的プログラミング]
---
## ひとことで

`getNamedRoute` は、名前をつけて登録したルートを、その名前から見つけ出す関数です。ルートを作るとき `->setName('user.show')` のように名前をつけておくと、この関数で後から URL を組み立てたり、ルートを取り出したりできます。見つからないときは、例外で知らせます。

## コード

```php:line-numbers=195
    public function getNamedRoute(string $name): RouteInterface
    {
        if (isset($this->routesByName[$name])) {
            $route = $this->routesByName[$name];
            if ($route->getName() === $name) {
                return $route;
            }

            unset($this->routesByName[$name]);
        }

        foreach ($this->routes as $route) {
            if ($name === $route->getName()) {
                $this->routesByName[$name] = $route;
                return $route;
            }
        }

        throw new RuntimeException('Named route does not exist for name: ' . $name);
    }
```

## 前提知識

- **名前つきルート**: ルートに、`user.show` のような分かりやすい名前をつけておく仕組みです。URL が変わっても、名前を使えばリンクを作り直せます。
- **連想配列による索引**: 名前をキーにした配列を作っておくと、先頭から全部を調べる代わりに、キーで直接取り出せます。`$this->routesByName` がその役目を持ちます。
- **`isset` と `unset`**: `isset` は、キーがあって `null` でないかを調べます。`unset` は、そのキーの値を配列から消します。
- **`RuntimeException`**: 実行中に起きた問題を表す例外です。ここでは「その名前のルートが存在しない」ことを知らせます。
- **ルートの登録**: `$this->routes` は、登録されたルートを順番に持つ一覧です。この関数は、その一覧が最後の探し先になります。

## 何をしているか

### 1. 名前の表を先に見る

```php:line-numbers=197
        if (isset($this->routesByName[$name])) {
            $route = $this->routesByName[$name];
            if ($route->getName() === $name) {
                return $route;
            }

            unset($this->routesByName[$name]);
        }
```

`isset($this->routesByName[$name])` で、この名前が表に覚えられているかを調べます。覚えがあれば、その `$route` を取り出し、名前が今も一致するかを確かめます。一致すればそのまま返します。一致しなければ、ルートの名前が変わったなどの理由で古くなっているので、`unset` で表から消します。

### 2. 全部のルートから探す

```php:line-numbers=206
        foreach ($this->routes as $route) {
            if ($name === $route->getName()) {
                $this->routesByName[$name] = $route;
                return $route;
            }
        }
```

表に無いか、古かったときは、`$this->routes` を順に回して、名前が一致するルートを探します。見つけたら、次の探索で早く見つけられるように、表へ覚えてから返します。

### 3. 見つからなければ例外

```php:line-numbers=213
        throw new RuntimeException('Named route does not exist for name: ' . $name);
```

どのルートにも一致しなければ、`RuntimeException` を投げます。メッセージに、探していた名前を入れているので、どの名前が無かったかがすぐ分かります。

## ここがすごい

- 表に覚えた結果を、必ず「今も同じ名前か」で確かめてから使っています。名前が変わったルートを、古いまま返してしまう誤りを防いでいます。
- 表が古くなったときに、その項目を消すだけで、ほかの部分に手を入れずに済みます。キャッシュの整合性を、この 1 か所で保っています。
- 見つけたルートを表に入れてから返すので、同じ名前への次の問い合わせは、一覧を回さずに答えられます。
- 見つからないときは、`null` ではなく例外にしています。呼び出し側は、存在を確かめ忘れても、問題が静かに隠れることがありません。

## まとめ

`getNamedRoute` は、名前からルートを探す関数です。名前の表を先に見て、古い覚えは消し、足りなければ全体から探して、見つかれば表へ覚えます。見つからないときは例外で知らせます。小さな索引と、整合性の確認を組み合わせた、わかりやすいキャッシュの例になっています。
