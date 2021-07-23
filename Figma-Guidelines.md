# Guidelines for Figma

It's a must to stick to these Guidelines when working on the Icon Library in Figma. Otherwise, we are at risk of our 
technical workflow to fail.

## Figma

### Variants Structure
- We use variants
- Variant property may only consist out of 1 property, which must be named `size`
- Naming Convention for Variants: should only contain variant property value, e.g.: `small`, `medium`, `large`

### Naming Conventions
- Variant parent becomes main name for the icon
- Variant parent + variant name becomes name for the icon. e.g.:
	- variant parent: lyne-warning-light
	- variant name: small:
  -> icon-name: `lyne-warning-light-small`

### Add Keywords as Metadata
- Description of Variant parent: An Object can be placed as description
	- Keywords can get added in the description field of the variant parent, comma-separated, like so: `{keywords: "key1, key2"}`

### Drawing Icons
- Icon Paths must be combined. This combined path must be the only child element of the icon component.

### File & Page structure

- Icon Types should be separated on different pages in the same figma file. These Icon Type names will get used to structure 
  the Icons in the Figma Library as well as on the documentation platform.
	- `UI Icons`
	- `Pictograms`
	- `Timetable Icons`
	...

- Icon Categories should be separated on different frames inside a page. These Icon Categories names will get used to structure 
  the Icons in the Figma Library as well as on the documentation platform (e.g., for UI Icons):
	- `Basic`
	- `Leisure`
	- `Arrows`
	...

- When publishing a library, the editor must enter an appropriate description according to semantic-commit.

- Names with leading underscore will get ignored for Pages, Frames, Components, Variants.

# TODO: Code

- remove fill attrs from svgs
- reconstruct ignore pattern: leading underscore
- description of component missing in api response

# TODO: Figma

- Make sure that `Size` is the only property on variants
