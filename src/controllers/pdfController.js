const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

exports.generateInvoice = async (req, res) => {
    try {
        const { tracking_number } = req.params;
        
        const [orders] = await db.execute(`SELECT * FROM orders WHERE tracking_number = ?`, [tracking_number]);
        if (orders.length === 0) {
            return res.status(404).json({ status: "Error", message: "Invoice not found" });
        }
        const order = orders[0];

        const [items] = await db.execute(`SELECT core_product_id, quantity, price_at_purchase FROM order_items WHERE order_id = ?`, [order.id]);

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const invoicePath = path.join(__dirname, `../../uploads/invoice-${tracking_number}.pdf`);
        const stream = fs.createWriteStream(invoicePath);
        doc.pipe(stream);

        const brandDark = '#1a252f';   
        const accentGold = '#b38f4d';  
        const textGray = '#555555';    
        const lightBg = '#f8f9fa';     

        doc.rect(40, 40, 515, 4).fillColor(accentGold).fill();
        doc.fillColor(brandDark)
           .font('Helvetica-Bold')
           .fontSize(24)
           .text('T-FASHION', 40, 60)
           .font('Helvetica')
           .fontSize(10)
           .fillColor(textGray)
           .text('Premium E-Commerce Platform', 40, 90)
           .text('Sanaa, Yemen', 40, 103);

        doc.fillColor(brandDark)
           .font('Helvetica-Bold')
           .fontSize(22)
           .text('INVOICE', 300, 60, { align: 'right', width: 255 })
           .font('Helvetica')
           .fontSize(10)
           .fillColor(accentGold)
           .text(`#${order.tracking_number}`, 300, 90, { align: 'right', width: 255 });

        doc.moveTo(40, 135).lineTo(555, 135).strokeColor('#e1e8ed').stroke();

        const dateObj = new Date(order.created_at);
        const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        const infoTop = 155;
        doc.rect(40, infoTop, 515, 65).fillColor(lightBg).fill();

        doc.fillColor(brandDark).font('Helvetica').fontSize(10);
        
        doc.font('Helvetica-Bold').text('Invoice Details:', 55, infoTop + 12);
        doc.font('Helvetica').text(`Issue Date: ${formattedDate}`, 55, infoTop + 27);
        doc.text(`Issue Time: ${formattedTime}`, 55, infoTop + 42);

        doc.font('Helvetica-Bold').text('Payment Info:', 350, infoTop + 12);
        doc.font('Helvetica').text(`Method: ${order.payment_method.toUpperCase()}`, 350, infoTop + 27);
        
        doc.text('Status: ', 350, infoTop + 42);
        doc.fillColor('#27ae60').font('Helvetica-Bold').text('PAID / COMPLETED', 392, infoTop + 42);

        const tableTop = 245;
        
        doc.rect(40, tableTop, 515, 28).fillColor(brandDark).fill();
        
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text('Product Details', 55, tableTop + 9, { align: 'left', width: 200 });
        doc.text('Quantity', 260, tableTop + 9, { align: 'center', width: 60 });
        doc.text('Unit Price', 340, tableTop + 9, { align: 'center', width: 100 });
        doc.text('Line Total', 450, tableTop + 9, { align: 'right', width: 90 });

        let yPosition = tableTop + 28;
        doc.font('Helvetica').fontSize(9);
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const price = Number(item.price_at_purchase);
            const lineTotal = item.quantity * price;

            if (i % 2 === 0) {
                doc.rect(40, yPosition, 515, 30).fillColor('#ffffff').fill();
            } else {
                doc.rect(40, yPosition, 515, 30).fillColor('#fcfcfc').fill();
            }

            doc.fillColor(brandDark);
            doc.text(`Product ID: #${item.core_product_id}`, 55, yPosition + 10, { align: 'left', width: 200 });
            doc.text(`${item.quantity}`, 260, yPosition + 10, { align: 'center', width: 60 });
            doc.text(`${price.toFixed(2)} YER`, 340, yPosition + 10, { align: 'center', width: 100 });
            doc.text(`${lineTotal.toFixed(2)} YER`, 450, yPosition + 10, { align: 'right', width: 90 });
            
            doc.moveTo(40, yPosition + 30).lineTo(555, yPosition + 30).strokeColor('#f1f1f1').stroke();
            yPosition += 30;
        }

        const summaryTop = yPosition + 25;
        doc.font('Helvetica').fontSize(10);
        
        const subtotal = Number(order.subtotal);
        const shippingFee = Number(order.shipping_fee);
        const discountApplied = Number(order.discount_applied);
        const totalAmount = Number(order.total_amount);

        doc.fillColor(textGray);
        doc.text('Subtotal:', 300, summaryTop, { align: 'right', width: 130 });
        doc.fillColor(brandDark).text(`${subtotal.toFixed(2)} YER`, 440, summaryTop, { align: 'right', width: 100 });

        doc.fillColor(textGray).text('Shipping Fee:', 300, summaryTop + 20, { align: 'right', width: 130 });
        doc.fillColor(brandDark).text(`${shippingFee.toFixed(2)} YER`, 440, summaryTop + 20, { align: 'right', width: 100 });
        
        let finalSummaryOffset = summaryTop + 40;

        if (discountApplied > 0) {
            doc.fillColor('#c0392b').text('Discount Applied:', 300, summaryTop + 20, { align: 'right', width: 130 });
            doc.text(`- ${discountApplied.toFixed(2)} YER`, 440, summaryTop + 20, { align: 'right', width: 100 });
            finalSummaryOffset = summaryTop + 60;
        }

        doc.moveTo(320, finalSummaryOffset - 5).lineTo(555, finalSummaryOffset - 5).strokeColor(accentGold).stroke();
        
        doc.rect(320, finalSummaryOffset, 235, 35).fillColor('#fffdf9').fill();
        
        doc.fillColor(brandDark).font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL AMOUNT:', 330, finalSummaryOffset + 12, { align: 'left' });
        doc.text(`${totalAmount.toFixed(2)} YER`, 440, finalSummaryOffset + 12, { align: 'right', width: 100 });

        doc.font('Helvetica').fontSize(9).fillColor('gray');
        doc.text('This is a computer-generated invoice and requires no physical signature.', 40, 740, { align: 'center', width: 515 });
        doc.font('Helvetica-Bold').fillColor(accentGold).text('Thank you for shopping with T-FASHION!', 40, 755, { align: 'center', width: 515 });

        doc.end();

        stream.on('finish', () => {
            res.status(200).json({ status: "Success", download_url: `/uploads/invoice-${tracking_number}.pdf` });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Error", message: "Failed to generate invoice due to an internal server error." });
    }
};