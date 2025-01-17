<img width="235" alt="ColorBlindPicker2" src="https://github.com/user-attachments/assets/378caee0-4570-4b7b-ac7d-510725775eee" />

# Color Blind Picker

**Color Blind Picker** is an open-source color picker designed to help people with color blindness identify colors. In addition to providing the Hex values of the selected color, **the software describes it in words**, making color recognition more accessible.

![Color Blind Picker 2](https://github.com/user-attachments/assets/5e6a501b-f63d-4124-9849-a8a3fc7d8b44) ![Color Blind Picker](https://github.com/user-attachments/assets/0ce12a56-1040-4917-b03b-8e8554b6d1c7)
![Color Blind Picker 3](https://github.com/user-attachments/assets/0197ae5e-1087-41b6-9cfc-8e06db751ea7) ![Color Blind Picker 4](https://github.com/user-attachments/assets/beb79173-14ff-447e-849b-a27d67a72f8b)
## Features  
As soon as the software starts, it immediately begins identifying the color under the mouse pointer, providing a real-time verbal description.  
The program includes several buttons that offer useful and intuitive functionality:  

1. **Settings:** Allows you to select the software language, choosing between English and Italian.  
2. **Pin:** Keeps the program always on top of other windows, preventing it from being hidden by other applications.  
3. **Picker:** This button lets you select and save a color.  
4. **History:** Displays all the colors you’ve saved using the Picker.  
5. **Copy:** Once the History is open, you can use this function to copy the selected color value in Hex or RGB format.  
6. **Delete:** From the History, you can remove a previously saved color.  

## How does it work?
The software converts the selected color from RGB format to HSL (Hue, Saturation, Lightness) format. Each component of this format is analyzed separately, and through a series of predefined checkpoints the software is able to construct a description. For example, a color with Hue 0 (red), Saturation 0.25 (tending to grayish) and Lightness 0.7 (light) might be described as Red Light Grayish. By identifying the closest checkpoint to each selected value, the program combines the descriptions to provide an understandable definition of the color.

## History of the project
The core of the project was developed two years ago for a friend. It has recently refined and completed to provide users with a ready-to-use application.
