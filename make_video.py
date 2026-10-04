import imageio.v3 as iio
import numpy as np
import os
import imageio

fps = 30
frame_duration = 1.0 # seconds to hold a frame
crossfade_duration = 0.5 # seconds to crossfade
total_frames = 8

def load_image(path):
    img = iio.imread(path)
    # Ensure it is RGB, not RGBA, and standard shape
    if img.shape[2] == 4:
        img = img[:, :, :3]
    return img

images = []
for i in range(1, total_frames + 1):
    path = f'public/sequence/frame-{i}.png'
    images.append(load_image(path))

# All images must be same size
base_shape = images[0].shape

# Create video writer
writer = imageio.get_writer('public/kost_sequence.mp4', fps=fps, quality=8, macro_block_size=None)

for i in range(total_frames):
    # 1. Write the static frame
    static_frames_count = int(frame_duration * fps)
    for _ in range(static_frames_count):
        writer.append_data(images[i])
        
    # 2. Write the crossfade to the next frame (if there is a next frame)
    if i < total_frames - 1:
        crossfade_frames_count = int(crossfade_duration * fps)
        for j in range(crossfade_frames_count):
            alpha = j / float(crossfade_frames_count)
            blended = (1.0 - alpha) * images[i] + alpha * images[i+1]
            writer.append_data(blended.astype(np.uint8))
            
writer.close()
print("Successfully created public/kost_sequence.mp4")
