---
title: "入力欄とボタンの変化を素早く滑らかにする"
description: "Water.css は button・input・textarea の transition に、背景色・枠の色・文字の色・影・変形を 0.1 秒で変化させる指定を入れる。操作への反応を、短い時間で滑らかに見せる。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [13, 15]
function: "\"button, input, textarea\""
difficulty: 2
format: 2
tags: [フォーム, アニメーション]
---
## ひとことで

Water.css は、ボタンと入力欄の色や影の変化を、0.1 秒の滑らかな動きにします。ホバーやフォーカスで、いきなり色が切り替わる感じを抑えています。

## コード

```css:line-numbers=13
button, input, textarea {
  transition: background-color 0.1s linear, border-color 0.1s linear, color 0.1s linear, box-shadow 0.1s linear, transform 0.1s ease;
}
```

## 前提知識

- **transition**: 値が変わるときの時間と曲線を決めるプロパティです。
- **プロパティの列挙**: 複数のプロパティを、カンマで並べて個別に時間を与えられます。
- **linear と ease**: linear は一定の速さ、ease は始めと終わりがゆるやかな動きです。ここでは色は linear、変形は ease が使われています。

## 何をしているか

### 1. 変化させる対象

```css:line-numbers=13
button, input, textarea {
  transition: background-color 0.1s linear, border-color 0.1s linear, color 0.1s linear, box-shadow 0.1s linear, transform 0.1s ease;
}
```

ボタン、入力欄、複数行の入力を対象にします。どれも、操作で色や影が変わる部品です。

## ここがすごい

時間を 0.1 秒と短くしているため、反応が即座に感じられます。長すぎると操作が遅れて見え、短すぎると変化に気づきにくいという、ちょうど良い値を選んでいます。

ボタンや入力欄は、押したり選んだりする部品なので、反応が遅れると操作が不安になります。0.1 秒の短い変化は、反応の速さと、動きの滑らかさを両立させる長さです。背景や枠の色だけでなく、影や変形もまとめて動かすことで、部品全体がまとまって反応しているように見えます。

色や影を個別に変えると、ボタンの背景だけが先に変わるなど、動きがばらばらに見えることがあります。複数のプロパティを一つの transition にまとめると、同じ時間で揃って変わるため、部品としての一体感が出ます。

## まとめ

短い transition を部品にまとめて与えると、操作への反応が、ひと目で分かる滑らかさになります。
