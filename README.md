# Zeplin Xamarin.Forms Extension

[Zeplin extension](https://extensions.zeplin.io/) for Xamarin.Forms.

[Available on GitHub](https://github.com/goldnarms/zeplin-extension-xamarin.forms).

## Samples

Sample colors output:
```xml
<Color x:Key="PrimaryColor">#FFFF0000</Color>
<Color x:Key="SecondaryColor">#FF00FF00</Color>
<Color x:Key="TertiaryColor">#FF0000FF</Color>
```

Sample text style output:
```xml
<Style x:Key="SampleTextStyle"
       TargetType="Label">
    <Setter Property="FontFamily"
            Value="SFProText" />
    <Setter Property="FontSize"
            Value="20" />
    <Setter Property="FontAttributes"
            Value="Bold" />
</Style>
```

Sample text layer output:
```xml
<Label Text="Hello"
           Style="{StaticResource SampleTextStyle}"
           HorizontalTextAlignment="Center">
```
## Options

#### Sort styleguide resources

Toggle whether styleguide resources should be sorted alphabetically or not.

#### Consolidate duplicates

Define the suffix that indicates that a resource is a duplicate and should be consolidated.

For example, using the value `_duplicate` would replace all instances of `PrimaryColor_duplicate` with `PrimaryColor` in generated snippets.

This is useful when dealing with values that are almost identical (i.e., `#FFFFFF` vs `#FFFFFE`) or properties that don't warrant a distinct style (i.e., `TextAlignment`).

#### Ignore FontFamily

Toggle whether `FontFamily` should be generated or not.


## Development
I have forked this from the XAML extension for UWP made by Nventive. You can find the repo [here](https://github.com/nventive/zeplin-extension-xaml).

This extension is developed using [zem](https://github.com/zeplin/zem), Zeplin Extension Manager. zem is a command line tool that lets you quickly create and test extensions.

To learn more about zem, [see documentation](https://github.com/zeplin/zem).

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
