
import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

st.set_page_config(page_title="FC Online 3D", layout="wide")
st.title("⚽ FC Online 3D")
st.caption("Game bóng đá 3D thử nghiệm trên trình duyệt")

html = Path("index.html").read_text(encoding="utf-8")

components.html(html, height=700, scrolling=False)
