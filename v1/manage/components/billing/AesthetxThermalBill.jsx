import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Image,
} from "@react-pdf/renderer";

// Vector path extracted from public/logo_t.svg
const LOGO_SVG_PATH =
  "M387.984 4.81442L389.837 5.64328C394.9 8.00967 398.931 10.9347 403.105 14.6269L404.866 16.1289C410.633 21.1423 415.905 26.1611 418.351 33.5644C418.668 34.4874 421.649 40.8635 421.975 41.8144C424.3 48.9273 424.246 55.9084 424.18 63.3208C424.162 65.4138 424.16 67.5064 424.16 69.5996C424.128 82.3736 423.183 94.9627 421.538 107.627C420.287 117.506 419.374 127.373 418.799 137.316C418.412 143.054 417.456 148.08 415.668 153.543C414.712 156.687 414.365 159.8 414.04 163.064C412.655 174.376 409.073 184.874 405.226 195.561C404.071 199.134 403.401 202.744 402.716 206.431L402.672 206.67C401.135 214.787 398.782 222.571 396.221 230.417C395.469 232.731 394.739 235.052 394.01 237.373C393.534 238.851 393.056 240.329 392.577 241.807L391.923 243.902C391.286 245.818 387.984 251.255 386.681 254.252C384.726 258.752 381.681 261.752 380.451 266.439C378.587 269.463 376.474 272.512 375.181 275.814C374.007 278.595 370.636 283.174 369.021 285.721L367.291 288.475L363.69 294.154L361.96 296.908L360.38 299.398C358.926 301.796 358.926 301.797 357.936 304.476L357.936 304.477C355.681 307.752 354.62 309.411 351.994 311.814L349.807 313.873C343.506 319.689 340.721 323.142 337.998 323.814C333.126 324.77 328.445 325.03 323.501 325.064L321.279 325.127C315.022 325.172 304.768 317.034 300.008 312.814C299.358 311.087 298.713 309.357 298.071 307.627C297.711 306.664 293.38 297.807 293.01 296.814C290.652 288.027 289.608 279.427 288.948 270.377C288.418 250.688 288.418 250.688 280.732 233.154C277.55 230.673 274.081 231.107 270.195 231.228C264.414 232.294 261.099 235.782 257.019 239.814C255.955 240.828 254.89 241.841 253.825 242.853C247.796 248.671 242.359 254.726 237.157 261.303C234.363 264.594 231.263 267.374 227.972 270.158L227.972 270.158C226.058 271.724 226.057 271.724 224.633 273.315C218.496 279.051 209.08 278.546 201.269 278.287C196.755 277.934 193.83 276.824 190.553 273.619L189.037 271.814L187.522 270.197C178.981 260.08 172.884 245.293 170.043 232.502C168.88 228.215 167.229 225 164.044 221.814C161.545 221.648 161.545 221.648 159.045 221.814C157.611 223.029 157.611 223.029 157.796 226.627C157.961 238.607 163.08 250.527 166.785 261.821C170.478 273.111 173.384 284.279 173.229 296.252L173.21 299.623C173.045 302.756 172.623 305.734 172.042 308.814C170.975 311.5 165.975 321 163.044 322.814C155.91 326.545 148.775 326.317 140.863 326.252L138.841 326.239C120.72 326.075 104.465 322.11 87.1896 317.002L85.097 316.389C76.1524 313.745 67.7991 310.516 59.4151 306.42C56.1977 304.874 52.9538 303.506 49.6372 302.189C44.7182 300.172 40.4144 297.901 36.0783 294.814C33.2578 292.807 27.8643 289.335 25.0812 287.002L22.4686 284.822L20.0825 282.814L18.3525 281.494C14.421 278.479 11.6271 274.846 8.69886 270.9C7.16018 268.807 7.16018 268.807 5.37944 267.166C1.47461 264.5 0.0410471 252.315 0.0254001 249.564L1.62207e-05 247.209C-0.00320558 246.455 0.974609 242.5 0.974609 242.5C3.34143 232.6 13.1716 217.721 21.4377 212.291C31.8295 206.487 46.0633 205.905 57.51 208.939C66.9845 212.558 74.1393 218.274 81.1287 225.502L83.423 227.801C88.923 233.391 88.923 233.391 90.0639 236.814L91.8603 238.6C94.4714 241.225 96.3617 244.13 98.3117 247.252L99.4905 249.11C102.098 253.235 104.644 257.397 107.184 261.564C110.599 267.144 114.215 272.522 118.056 277.814L119.993 280.627C123.634 284.489 127.362 287.429 132.724 288.197C135.247 288.248 137.565 288.253 140.051 287.814C142.37 285.917 142.451 285.852 142.315 282.5C142.061 281.799 137.543 269.412 137.282 268.689C135.467 263.685 133.646 258.684 131.764 253.705C131.283 252.426 130.809 251.145 130.342 249.861C128.74 245.485 126.95 241.232 125.019 236.99C124.345 235.469 123.703 233.934 123.086 232.389C122.382 230.631 121.642 228.888 120.872 227.158C118.053 220.763 116.117 214.576 114.733 207.725C114.156 204.852 114.156 204.852 113.038 202.436C110.192 194.826 110.939 186.306 110.996 178.314L111.009 174.666C111.021 171.715 112.475 166 112.933 162.939C113.029 160.545 114.885 157.599 115.242 157.282L116.119 154.752C119.764 146.002 128.722 139.717 137.051 135.814C148.674 131.417 160.21 135.779 171.959 139.172C179.269 141.526 186.636 150.6 190.326 157.076C193.731 164.292 194.174 171.492 194.282 179.361C194.315 181.029 194.348 182.697 194.382 184.365C194.429 186.944 194.473 189.524 194.513 192.103C194.664 201.465 194.988 210.764 195.926 220.084L196.15 222.391C197.017 230.277 198.529 239.621 204.576 245.131C207.953 247.446 209.611 247.935 213.656 247.877C214.473 247.868 217.228 246.5 218.03 245.814C220.119 244.334 220.119 244.334 222.966 242.627L222.966 242.627C228.289 239.328 233.147 235.731 238.024 231.814C240.873 229.562 243.728 227.319 246.588 225.082C249.518 222.789 252.434 220.484 255.317 218.131C274.935 202.281 274.935 202.281 286.711 203.342C296.114 205.274 300.684 209.981 306.006 217.814L307.244 219.607C310.481 224.492 312.401 229.28 314.067 234.877C315.394 239.283 316.649 243.432 319.038 247.389C321.157 251.084 322.258 254.493 323.377 258.564C325.869 267.042 328.959 276.04 335.998 281.814C338.28 282.367 338.28 282.367 340.622 282.189L342.973 282.15C345.219 281.979 345.681 282.15 348.181 281.252C349.988 280.603 349.681 280.752 350.994 279.814C356.56 261.91 353.684 240.655 348.995 222.814C348.617 221.316 348.239 219.817 347.862 218.318C347.074 215.235 346.255 212.162 345.418 209.092C344.324 205.073 343.284 201.043 342.262 197.006L341.346 193.403C340.754 191.075 340.167 188.746 339.584 186.416C338.003 180.23 336.176 174.29 333.832 168.353C333.594 167.297 330.762 160.759 330.519 159.682C328.855 152.639 326.712 145.919 324.185 139.139C322.971 135.727 321.965 132.305 321.002 128.814L321.002 128.814C318.345 119.392 318.345 119.392 315.515 110.021C312.657 100.819 310.22 91.8248 308.744 82.2949C308.133 78.755 308.133 78.755 306.444 75.5136C304.571 70.6944 304.603 66.5567 304.694 61.4394L304.684 58.7285C304.743 51.4035 305.121 43.7141 309.505 37.5644C310.958 35.4904 312.02 33.7738 312.899 31.3847C315.049 26.3829 319.296 22.723 323.002 18.8144L324.833 16.8222C340.365 0.449863 367.381 -4.8346 387.984 4.81442Z";

export const STORE_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE",
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E",
  },
};

const SIZE_MAP = {
  S: "28",
  M: "30",
  L: "32",
  XL: "34",
  XXL: "36",
  XXXL: "38",
};

// 80mm roll width: 80 * (72 / 25.4) = 226.77 pt
const ROLL_WIDTH_PT = 226.77;

const styles = StyleSheet.create({
  page: {
    width: ROLL_WIDTH_PT,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "Helvetica",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  brandBadge: {
    backgroundColor: "#000000",
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 2,
    textAlign: "center",
    marginVertical: 2,
    textTransform: "uppercase",
  },
  storeTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  storeAddress: {
    fontSize: 6.8,
    color: "#222222",
    textAlign: "center",
    lineHeight: 1.25,
    marginTop: 1.5,
    maxWidth: 190,
  },
  storePhoneGst: {
    fontSize: 6.8,
    color: "#111111",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 1.5,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    marginVertical: 4,
  },
  doubleDashedDivider: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    paddingVertical: 3,
    marginVertical: 4,
  },
  metaContainer: {
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  metaVal: {
    fontSize: 7,
    fontFamily: "Courier",
    color: "#000000",
  },
  metaValBold: {
    fontSize: 7.5,
    fontFamily: "Courier-Bold",
    color: "#000000",
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    paddingVertical: 3,
    marginTop: 3,
  },
  thNum: { width: "8%", fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "left" },
  thItem: { width: "56%", fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "left" },
  thQty: { width: "14%", fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  thAmt: { width: "22%", fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    borderBottomStyle: "dashed",
  },
  tdNum: { width: "8%", fontSize: 7, fontFamily: "Courier", textAlign: "left" },
  tdItem: { width: "56%", paddingRight: 3 },
  tdItemTitle: { fontSize: 7.2, fontFamily: "Helvetica-Bold", color: "#000000" },
  tdItemSize: { fontSize: 6.2, fontFamily: "Courier", color: "#444444", marginTop: 1 },
  tdQty: { width: "14%", fontSize: 7, fontFamily: "Courier", textAlign: "center" },
  tdAmt: { width: "22%", fontSize: 7.2, fontFamily: "Courier-Bold", textAlign: "right" },
  totalsContainer: {
    marginTop: 3,
    paddingTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1,
  },
  totalLabel: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  totalVal: {
    fontSize: 7.2,
    fontFamily: "Courier-Bold",
    color: "#111111",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  grandTotalVal: {
    fontSize: 10,
    fontFamily: "Courier-Bold",
    color: "#000000",
  },
  paymentBadge: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: "center",
    alignSelf: "center",
    marginVertical: 4,
  },
  paymentBadgeText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  qrSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
  },
  qrTitle: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  qrImage: {
    width: 80,
    height: 80,
    alignSelf: "center",
  },
  qrAmount: {
    fontSize: 8.5,
    fontFamily: "Courier-Bold",
    marginTop: 2,
  },
  qrUpiId: {
    fontSize: 6.5,
    fontFamily: "Courier",
    color: "#222222",
    marginTop: 1,
  },
  footerContainer: {
    marginTop: 4,
    alignItems: "center",
  },
  footerThankYou: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 1,
  },
  footerWebsite: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  footerNotice: {
    fontSize: 5.8,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    color: "#444444",
    marginTop: 2,
  },
});

export default function AesthetxThermalBill({ bill = {}, qrCodeDataUrl = "" }) {
  const branchKey = String(bill.branch || "patna").toLowerCase();
  const currentBranch = STORE_BRANCHES[branchKey] || STORE_BRANCHES.patna;

  const storeTitle = bill.storeName || currentBranch.storeName;
  const storeAddr = bill.storeAddress || currentBranch.storeAddress;
  const storePhone = bill.storePhone || currentBranch.phone;
  const storeGst = currentBranch.gstin || "10AAACA0000A1Z5";
  const upiId = bill.upiId || currentBranch.upiId || "aesthetxways07@okicici";

  const items = bill.items || [];
  const itemsCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const subtotal = Number(bill.subtotal ?? bill.total ?? 0);
  const discountAmount = Number(bill.discountAmount || 0);
  const roundOff = Number(bill.roundOff || 0);
  const roundOffStr = roundOff >= 0 ? `+Rs. ${roundOff.toFixed(2)}` : `-Rs. ${Math.abs(roundOff).toFixed(2)}`;
  const grandTotal = Number(bill.total ?? bill.grandTotal ?? 0);

  const isSplit = String(bill.paymentMethod || "").toLowerCase() === "split";
  const splitDetails = bill.splitDetails || {};
  const upiTargetAmount = isSplit && splitDetails.online ? Number(splitDetails.online) : grandTotal;

  const formattedDate = new Date(bill.createdAt || Date.now()).toLocaleDateString("en-GB");
  const formattedTime = new Date(bill.createdAt || Date.now()).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const rawCashier = bill.createdBy || "POS Cashier";
  const cashierLabel = rawCashier.replace(/\s*\([^)]*\)/g, "").trim();

  // Precise continuous roll height calculation (snug fit with zero trailing blank paper)
  const hasCustomer = Boolean(bill.customerName);
  const hasPhone = Boolean(bill.customerPhone);
  const hasDiscount = discountAmount > 0;
  const hasRoundOff = roundOff !== 0;
  const hasSplit = isSplit && splitDetails && (splitDetails.cash || splitDetails.online);

  const headerHeight = 78;
  const metaHeight = 28 + (hasCustomer ? 10 : 0) + (hasPhone ? 10 : 0);
  const tableHeaderHeight = 18;
  const itemsHeight = items.reduce((acc, item) => {
    const name = String(item.productName || item.name || "Item").trim();
    // 56% column width is ~118pt. Helvetica-Bold 7.2pt averages ~5.2pt per char => ~20 chars/line
    const lines = Math.max(1, Math.ceil(name.length / 20));
    const titleHeight = lines * 10;
    const hasSize = item.size && item.size !== "Standard";
    const sizeHeight = hasSize ? 9.5 : 0;
    return acc + titleHeight + sizeHeight + 7; // 6pt paddingVertical + 1pt border
  }, 0);
  const totalsHeight = 44 + (hasDiscount ? 11 : 0) + (hasRoundOff ? 11 : 0) + (hasSplit ? 20 : 0);
  const qrHeight = qrCodeDataUrl ? 120 : 0;
  const footerHeight = 34;
  const paddingHeight = 16; // 8 top + 8 bottom

  const calculatedHeight = Math.ceil(
    headerHeight +
      metaHeight +
      tableHeaderHeight +
      itemsHeight +
      totalsHeight +
      qrHeight +
      footerHeight +
      paddingHeight +
      10 // snug safety buffer ensuring crisp single-page boundary
  );

  return (
    <Document title={`Bill-${bill.billNumber || "Invoice"}`}>
      <Page size={[ROLL_WIDTH_PT, calculatedHeight]} style={styles.page}>
        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Svg width={42} height={32} viewBox="0 0 425 327">
              <Path d={LOGO_SVG_PATH} fill="#000000" />
            </Svg>
          </View>

          <Text style={styles.storeTitle}>{storeTitle}</Text>
          <Text style={styles.storeAddress}>{storeAddr}</Text>
          <Text style={styles.storePhoneGst}>
            Support: {storePhone} 
          </Text>
        </View>

        {/* Separator */}
        <View style={styles.dashedDivider} />

        {/* Metadata */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date & Time:</Text>
            <Text style={styles.metaVal}>{formattedDate} {formattedTime}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Bill No.:</Text>
            <Text style={styles.metaValBold}>#{bill.billNumber || "—"}</Text>
          </View>
          {bill.customerName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Customer:</Text>
              <Text style={styles.metaVal}>{bill.customerName}</Text>
            </View>
          ) : null}
          {bill.customerPhone ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone:</Text>
              <Text style={styles.metaVal}>{bill.customerPhone}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Partner:</Text>
            <Text style={styles.metaVal}>{cashierLabel}</Text>
          </View>
        </View>

        {/* Items Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.thNum}>#</Text>
          <Text style={styles.thItem}>ITEM</Text>
          <Text style={styles.thQty}>QTY</Text>
          <Text style={styles.thAmt}>AMOUNT</Text>
        </View>

        {/* Line Items */}
        {items.map((item, idx) => {
          const itemSize = item.size && item.size !== "Standard" ? item.size : null;
          const numericSize = itemSize ? SIZE_MAP[itemSize] || null : null;
          const sizeLabel = itemSize ? (numericSize ? `${itemSize} (${numericSize})` : itemSize) : null;
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          const itemTotal = (itemPrice * itemQty).toFixed(2);

          return (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tdNum}>{idx + 1}</Text>
              <View style={styles.tdItem}>
                <Text style={styles.tdItemTitle}>{item.productName || item.name || "Item"}</Text>
                {sizeLabel ? (
                  <Text style={styles.tdItemSize}>Size: {sizeLabel}</Text>
                ) : null}
              </View>
              <Text style={styles.tdQty}>{itemQty}</Text>
              <Text style={styles.tdAmt}>Rs. {itemTotal}</Text>
            </View>
          );
        })}

        {/* Totals & Calculations */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Qty: {itemsCount}</Text>
            <Text style={styles.totalVal}>Sub Total: Rs. {subtotal.toFixed(2)}</Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount {bill.discountType === "flat" ? "(Flat)" : `(${bill.discount || 0}%)`}:
              </Text>
              <Text style={styles.totalVal}>-Rs. {discountAmount.toFixed(2)}</Text>
            </View>
          ) : null}

          {roundOff !== 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Round off:</Text>
              <Text style={styles.totalVal}>{roundOffStr}</Text>
            </View>
          ) : null}

          {/* Grand Total with double dashed border */}
          <View style={styles.doubleDashedDivider}>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalVal}>Rs. {grandTotal.toFixed(2)}</Text>
            </View>
          </View>

        
        </View>

      

        {/* Dynamic UPI QR Code (if provided) */}
        {qrCodeDataUrl ? (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>
              {isSplit ? "SCAN TO PAY ONLINE PORTION VIA UPI" : "SCAN TO PAY VIA UPI"}
            </Text>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
            <Text style={styles.qrAmount}>Rs. {upiTargetAmount.toFixed(2)}</Text>
            <Text style={styles.qrUpiId}>UPI ID: {upiId}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerThankYou}>Thank you for shopping with us..!!</Text>
          <Text style={styles.footerWebsite}>Visit Our Store Online: aesthetxways.com</Text>
          <Text style={styles.footerNotice}>* Exchange within 7 days with original bill & tag intact</Text>
        </View>
      </Page>
    </Document>
  );
}
