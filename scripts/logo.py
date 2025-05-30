from PIL import Image, ImageDraw, ImageFont

# Text and styling
text = "DiffLite"
font_size = 100  # Large font to scale down cleanly
calm_blue = (70, 130, 180, 255)
font_path = "/usr/share/fonts/Tomorrow-Regular.ttf"

# Load font
try:
    font = ImageFont.truetype(font_path, font_size)
except IOError:
    font = ImageFont.load_default()
    print("Custom font not found. Using default font.")

# Measure original text size
bbox = font.getbbox(text)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Create high-res base image (for better downscaling)
base_size = 512
base_image = Image.new("RGBA", (base_size, base_size), (255, 255, 255, 0))
draw = ImageDraw.Draw(base_image)

# Center text on base image
x = (base_size - text_width) // 2 - bbox[0]
y = (base_size - text_height) // 2 - bbox[1]
draw.text((x, y), text, font=font, fill=calm_blue)

# Resize and save 128×128
icon_128 = base_image.resize((128, 128), Image.LANCZOS)
icon_128.save("icon_128.png")

# Resize and save 256×256
icon_256 = base_image.resize((256, 256), Image.LANCZOS)
icon_256.save("icon_256.png")

print("Saved icon_128.png and icon_256.png")