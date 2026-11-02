---
title: モデルに追加する仮想の項目を、配列に変換する準備をする
description: Laravel の getArrayableAppends は、モデルの $appends に登録された仮想の項目の名前を、配列にしたときに使える「名前から名前へ」の対応表に変えます。項目が無いときは、何もせずに空の配列を返します。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php
lines: [373, 384]
function: getArrayableAppends
difficulty: 2
format: 2
tags: [データ構造, 型システム, API設計]
---
## ひとことで

`getArrayableAppends` は、Eloquent のモデルを配列や JSON に変換するときに、追加で含める項目（`$appends`）を準備する関数です。`$appends` には、データベースに列としてなくても、アクセサで作られる項目の名前を並べます。この関数は、その名前を、配列の形で使える対応表にして返します。

## コード

```php:line-numbers=373
    protected function getArrayableAppends()
    {
        $appends = $this->getAppends();

        if (! count($appends)) {
            return [];
        }

        return $this->getArrayableItems(
            array_combine($appends, $appends)
        );
    }
```

## 前提知識

- **Eloquent モデル**: データベースの 1 行を、PHP のオブジェクトとして扱う Laravel の仕組みです。`toArray` や `toJson` で、配列や JSON に変換できます。
- **アクセサ**: モデルの項目を取り出すときに、値を加工して返す仕組みです。`fullName` のような、データベースの列にない項目を作れます。
- **`$appends`**: 配列や JSON に変換するとき、アクセサの項目も含めるように指定する、モデルの配列です。
- **`array_combine`**: 2 つの配列を、一方を鍵、もう一方を値にして組み合わせる関数です。
- **`count` と空の配列**: 要素の数を数える関数です。0 のときは、処理を省いて空の配列を返せます。

## 何をしているか

### 1. 追加する項目の名前を取り出す

```php:line-numbers=375
        $appends = $this->getAppends();

        if (! count($appends)) {
            return [];
        }
```

`getAppends` で、モデルの `$appends` の名前の一覧を得ます。その数が 0 なら、何もせずに空の配列を返します。項目が無いモデルでは、余計な処理を行わずに済みます。

### 2. 名前を、鍵と値の組にする

```php:line-numbers=381
        return $this->getArrayableItems(
            array_combine($appends, $appends)
        );
```

`array_combine` で、名前の配列を、そのまま鍵と値の両方に使った連想配列にします。たとえば `['full_name']` は、`['full_name' => 'full_name']` になります。この形にすると、後の処理で、名前による検索や、表示する項目の絞り込みがしやすくなります。その後、`getArrayableItems` に渡して、表示の対象として整えてもらいます。

## ここがすごい

- 項目の無いときは、早く空の配列を返します。ほとんどのモデルで、余計な処理が省かれます。
- 名前の一覧を、鍵と値の対応にしてから次の処理へ渡しています。配列の重なりを調べるときに、キーで直接探せる形になっています。
- `getArrayableItems` に任せて、表示の対象を決める処理を分けています。この関数は、名前を準備することだけに専念しています。
- メソッド名の `getArrayable` という接頭辞は、「配列に変換するため」の準備であることを表しています。名前だけで役割が分かる作りです。

## まとめ

`getArrayableAppends` は、モデルの `$appends` に並んだ仮想の項目の名前を、配列変換で使える鍵と値の対応表にする関数です。項目が無いときは何もしない、という早い戻りで、ほとんどのモデルで無駄を省きます。Eloquent が配列や JSON へ変換する過程の、準備の一段を担っています。
