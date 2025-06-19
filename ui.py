import streamlit as st

def load_custom_css():
    with open("theme.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)