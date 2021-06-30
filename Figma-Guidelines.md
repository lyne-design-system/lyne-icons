# Guidelines for Figma

It's a must to stick to these Guidlines when working on the Icon Library in Figma. Otherwise, we are at risk of our technical workflow to fail.

## Figma

### Variants Structure
- We use variants
- Variant property may only consist out of 1 property, which must be named `size`
- Naming Convention for Variants: should only contain variant property value, e.g.: `small`, `medium`, `large`

### Naming conventions
- Variant parent becomes main name for the icon
- Variant parent + variant name becomes name for the icon. e.g.:
	- variant parent: lyne-warning-light
	- variant name: small:
  -> icon-name: `lyne-warning-light-small`

### Keywording
- Description of Variant parent: An Object can be placed as description
	- Keywords may be entered in the description field of the variant parent, comma-separated, like so: `{keywords: "key1, key2"}`

### Drawing Icons
- Icon Paths must be combined. This combined path must be the only Children of the Icon component.

### File & Page structrue

- Icon Types are separated by different pages in the same figma file. These Icon Type names are used to structure the Icons in the Figma Library as well on the documentation of the Design System.
	- `UI Icons`
	- `Pictograms`
	- `Timetable Icons`
	...

- Icon Categories are structured on different Frames inside a Page. These Icon Categories names are used to structure the Icons in the Figma Library as well on the documentation of the Design System. e.g. for UI Icons:
	- `Basic`
	- `Leisure`
	- `Arrows`
	...

- When publishing a library, Editor must enter an appropriate Description according to semantic-commit.

- Names with leading underscore are ignored for Pages, Frames, Components, Variants

# TODO: Code

- remove fill attrs from svgs
- reconstruct ignore pattern: leading underscore
- description of component missing in api response

# TODO: Figma

- Make sure that `Size` is the only property on variants
