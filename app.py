
import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

st.set_page_config(page_title="FC Online 3D", layout="wide")
st.title("⚽ FC Online 3D")
st.caption("Game bóng đá 3D thử nghiệm trên trình duyệt")

html = Path("index.html").read_text(encoding="utf-8")

components.html(html, height=700, scrolling=False)

from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="FC3D", layout="wide")

st.title("FC3D - Game bóng đá 3D")

try:
    html = Path("index.html").read_text(encoding="utf-8")
    game_js = Path("game.js").read_text(encoding="utf-8")

    if "<!-- GAME_JS -->" not in html:
        st.error("Không tìm thấy <!-- GAME_JS --> trong index.html")
    else:
        script = (
            '<script type="module">'
            + game_js
            + '</script>'
        )
        html = html.replace("<!-- GAME_JS -->", script)

        st.info("Đã đọc được các tệp. Đang khởi chạy game...")
        components.html(html, height=720, scrolling=False)

except Exception as e:
    st.error(f"Lỗi khởi chạy game: {e}")
